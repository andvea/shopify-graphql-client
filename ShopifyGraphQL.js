'use strict';
import fetch from 'node-fetch';

class Queue {
  constructor() {
    this.frontIndex = 0;
    this.backIndex = 0;
  }
  enqueue(item) {
    this.backIndex++;
    return this.backIndex - 1;
  }
  dequeue() {
    this.frontIndex++;
    return true;
  }
  peek() {
    return this.frontIndex;
  }
}

export class ShopifyGraphQL {
  constructor(configObject) {
    this.fetch = fetch;
    this.configObject = configObject;
    this.queue = new Queue();

    if (!this.configObject.apiEndpoint) {
      throw new Error('Missing Shop URL');
    }
    if (!this.configObject.apiKey) {
      throw new Error('Missing Shop Api Key');
    }

    this.configObject.retryThrottles =
      (this.configObject.retryThrottles!=undefined ?
        this.configObject.retryThrottles :
        true);

    this.configObject.maxConcurrentRequests =
      (this.configObject.maxConcurrentRequests!=undefined ?
        this.configObject.maxConcurrentRequests :
        5);

    this._metrics = {
      total: 0,
      executions: 0,
      processing: 0,
      success: 0,
      errors: 0,
      throttles: 0,
    };
  }

  _syncDelay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  request(body, retries = 0) {
    return new Promise(async (resolve, reject) => {
      this._metrics.total += 1;
      if (this._metrics.processing < this.configObject.maxConcurrentRequests) {
        return this._executeRequest(body)
            .then((s) => resolve(s))
            .catch((r) => reject(r));
      } else {
        const REQ_QUEUE_ID = this.queue.enqueue();
        while (1==1) {
          await this._syncDelay(10);
          if (
            this._metrics.processing <
              this.configObject.maxConcurrentRequests &&
            this.queue.peek() == REQ_QUEUE_ID
          ) {
            this.queue.dequeue();
            return await this._executeRequest(body)
                .then((s) => resolve(s))
                .catch((r) => reject(r));
          }
        }
      }
    });
  }

  _executeRequest(body) {
    return new Promise((resolve, reject) => {
      this._metrics.processing += 1;
      this._metrics.executions += 1;
      this.fetch(this.configObject.apiEndpoint, {
        method: 'POST',
        headers: {
          'Accept': 'text/html',
          'Content-Type': 'application/graphql',
          'X-Shopify-Access-Token': this.configObject.apiKey,
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
            this._metrics.processing -= 1;
            this._metrics.errors += 1;
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
          let isThrottled = false;
          for (let i=0; i<JSON_RESULT.errors.length; i++) {
            if (JSON_RESULT.errors[i].extensions.code == 'THROTTLED') {
              isThrottled = true;
            }
          }

          if (isThrottled) {
            this._metrics.throttles += 1;
          } else {
            this._metrics.errors += 1;
          }

          if (
            !isThrottled ||
            (isThrottled && !this.configObject.retryThrottles)
          ) {
            this._metrics.processing -= 1;
            return reject(new Error('', {
              cause: {
                status: (isThrottled ? 'throttled' : shopifyResult.status),
                errors: JSON_RESULT.errors,
                userErrors: false,
                cost: (JSON_RESULT.extensions ?
                  JSON_RESULT.extensions.cost :
                  null),
              }}));
          }
          // How long must I wait?
          // (actualQueryCost is null for throttled requests)
          const QUERY_COST = JSON_RESULT.extensions.cost;
          const BACKOFF_MS =
            Math.max(0,
                (QUERY_COST.requestedQueryCost -
                  QUERY_COST.throttleStatus.currentlyAvailable) /
                QUERY_COST.throttleStatus.restoreRate) * 1000;
          // Wait for backoff time..
          await this._syncDelay(BACKOFF_MS);
          this._metrics.processing -= 1;
          // ..and retry the request!
          return this._executeRequest(body)
              .then((s) => resolve(s))
              .catch((r) => reject(r));
        }
        // Check response's userErrors body property
        const JSON_RESULT_FIRST_KEY = Object.keys(JSON_RESULT.data)[0];
        if (
          typeof JSON_RESULT.data[JSON_RESULT_FIRST_KEY] === 'object' &&
          JSON_RESULT.data[JSON_RESULT_FIRST_KEY] != null &&
          JSON_RESULT.data[JSON_RESULT_FIRST_KEY].userErrors &&
          JSON_RESULT.data[JSON_RESULT_FIRST_KEY].userErrors.length > 0
        ) {
          this._metrics.processing -= 1;
          this._metrics.errors += 1;
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

        this._metrics.processing -= 1;
        this._metrics.success += 1;
        return resolve({
          status: 'executed',
          response: JSON_RESULT,
          retries: 0,
        });
      }).catch((shopifyError) => {
        this._metrics.processing -= 1;
        this._metrics.errors += 1;
        return reject(new Error('', {cause: shopifyError}));
      });
    });
  }
}