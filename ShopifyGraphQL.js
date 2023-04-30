'use strict';
import fetch from 'node-fetch';

export class ShopifyGraphQL {
  constructor(configObject) {
    this.fetch = fetch;
    this.configObject = configObject;

    if (!this.configObject.shopUrl) {
      throw new Error('Missing Shop URL');
    }
    if (!this.configObject.shopApiKey) {
      throw new Error('Missing Shop Api Key');
    }

    this.configObject.retryThrottles =
      (this.configObject.retryThrottles!=undefined ?
        this.configObject.retryThrottles :
        true);
  }

  _syncDelay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  request(body, retries = 0) {
    return new Promise((resolve, reject) => {
      this.fetch(this.configObject.shopUrl, {
        method: 'POST',
        headers: {
          'Accept': 'text/html',
          'Content-Type': 'application/graphql',
          'X-Shopify-Access-Token': this.configObject.shopApiKey,
        },
        body: body,
      }).then(async (shopifyResult) => {
        // Parse response's body
        const JSON_RESULT = await shopifyResult.json();
        // Check response's HTTP status code
        switch (true) {
          case shopifyResult.status >= 200 && shopifyResult.status <= 299:
            // Ok, go ahead
            break;
          // case shopifyResult.status >= 500 && shopifyResult.status <= 599:
          // case shopifyResult.status == 429:
          default:
            // Generic error, quit
            return reject(new Error('', {
              cause: {
                status: shopifyResult.status,
                errors: JSON_RESULT.errors,
                userErrors: false,
                cost: (JSON_RESULT.extensions ?
                  JSON_RESULT.extensions.cost :
                  null)}}));
            break;
        }
        // Check response's errors body property
        if (JSON_RESULT.errors!=undefined) {
          let _isThrottled = false;
          for (let i=0; i<JSON_RESULT.errors.length; i++) {
            if (JSON_RESULT.errors[i].extensions.code == 'THROTTLED') {
              _isThrottled = true;
            }
          }
          // Retry with backoff if allowed by user, otherwise quit
          if (_isThrottled && this.configObject.retryThrottles) {
            // How long must I wait?
            // (actualQueryCost is null for throttled requests)
            const _x = JSON_RESULT.extensions.cost;
            const _backoffMs =
              Math.max(0,
                  (_x.requestedQueryCost -
                    _x.throttleStatus.currentlyAvailable) /
                  _x.throttleStatus.restoreRate) * 1000;
            // Wait for backoff time..
            await this._syncDelay(_backoffMs);
            // ..and retry the request!
            return this.request(body, retries+1)
                .then((s) => resolve(s))
                .catch((r) => reject(r));
          } else {
            return reject(new Error('', {
              cause: {
                status: (_isThrottled ? 'throttled' : shopifyResult.status),
                errors: JSON_RESULT.errors,
                userErrors: false,
                cost: (JSON_RESULT.extensions ?
                  JSON_RESULT.extensions.cost :
                  null),
              }}));
          }
        }
        // Check response's userErrors body property
        const JSON_RESULT_FIRST_KEY = Object.keys(JSON_RESULT.data)[0];
        if (
          typeof JSON_RESULT.data[JSON_RESULT_FIRST_KEY] === 'object' &&
          JSON_RESULT.data[JSON_RESULT_FIRST_KEY] != null &&
          JSON_RESULT.data[JSON_RESULT_FIRST_KEY].userErrors &&
          JSON_RESULT.data[JSON_RESULT_FIRST_KEY].userErrors.length > 0
        ) {
          return reject(new Error('', {
            cause: {
              status: shopifyResult.status,
              errors: false,
              userErrors: JSON_RESULT.data[JSON_RESULT_FIRST_KEY].userErrors,
              cost: (JSON_RESULT.extensions ?
                JSON_RESULT.extensions.cost :
                null),
            }}));
        }

        return resolve({
          status: 'executed',
          response: JSON_RESULT,
          retries: retries,
        });
      }).catch((shopifyError) => {
        return reject(new Error('', {cause: shopifyError}));
      });
    });
  }
}
