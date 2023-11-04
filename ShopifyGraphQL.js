'use strict';
import http2 from 'node:http2';
import {URL} from 'node:url';

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
    this.configObject = configObject;
    this.queue = new Queue();
    this._http2_session = null;
    this.userAgent = 'shopify-graphql-client/1.1.0 '+
        '(+https://github.com/andvea/shopify-graphql-client)';

    if (!this.configObject.apiEndpoint) {
      throw new Error('Missing Shop URL');
    } else {
      this.configObject.apiEndpoint = new URL(this.configObject.apiEndpoint);
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
            .catch((r) => reject(r))
            .finally((f) => {
              if (this._metrics.processing == 0) {
                this._http2_session.close();
                this._http2_session = null;
              }
            });
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
                .catch((r) => reject(r))
                .finally((f) => {
                  if (this._metrics.processing == 0) {
                    this._http2_session.close();
                    this._http2_session = null;
                  }
                });
          }
        }
      }
    });
  }

  _executeRequest(body) {
    return new Promise((resolve, reject) => {
      this._metrics.processing += 1;

      if (!this._http2_session) {
        this._http2_session =
          http2.connect('https://'+this.configObject.apiEndpoint.hostname);
      }

      const HTTP_STREAM = this._http2_session.request({
        ':path': this.configObject.apiEndpoint.pathname,
        ':method': 'POST',
        'Accept': 'text/html',
        'Content-Type': 'application/graphql',
        'User-Agent': this.userAgent,
        'X-Shopify-Access-Token': this.configObject.apiKey,
      });

      HTTP_STREAM.write(body, 'utf8');
      // Tell the server that all of requests' headers and body have been sent
      HTTP_STREAM.end();

      const HTTP_STREAM_RES = {
        status: undefined,
        body: '',
      };

      HTTP_STREAM.on('response', (headers, flags) => {
        HTTP_STREAM_RES.status = headers[':status'];
      });

      HTTP_STREAM.on('data', (chunk) => {
        HTTP_STREAM_RES.body += chunk;
      });

      HTTP_STREAM.on('end', async () => {
        // Parse response's body
        const JSON_RESULT = JSON.parse(HTTP_STREAM_RES.body);
        // Check response's HTTP status code
        if (HTTP_STREAM_RES.status < 200 || HTTP_STREAM_RES.status > 299) {
          this._metrics.processing -= 1;
          this._metrics.errors += 1;
          return reject(new Error('Shopify returned '+HTTP_STREAM_RES.status+
            ' as response code. Please see https://shopify.dev/docs/api/usage/response-codes', {
            cause: {
              status: HTTP_STREAM_RES.status,
              errors: JSON_RESULT.errors,
              userErrors: false,
              cost: (JSON_RESULT.extensions ?
                JSON_RESULT.extensions.cost :
                null)}}));
        }
        // Check response's errors body property
        if (JSON_RESULT.errors!=undefined) {
          let isThrottled = false;
          for (let i=0; i<JSON_RESULT.errors.length; i++) {
            if (
              JSON_RESULT.errors[i].extensions &&
              JSON_RESULT.errors[i].extensions.code &&
              JSON_RESULT.errors[i].extensions.code == 'THROTTLED') {
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
            return reject(new Error(JSON_RESULT.errors[0].message, {
              cause: {
                status: (isThrottled ? 'throttled' : HTTP_STREAM_RES.status),
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
        const JSON_RESULT_1ST_KEY = Object.keys(JSON_RESULT.data)[0];
        if (
          typeof JSON_RESULT.data[JSON_RESULT_1ST_KEY] === 'object' &&
          JSON_RESULT.data[JSON_RESULT_1ST_KEY] != null &&
          JSON_RESULT.data[JSON_RESULT_1ST_KEY].userErrors &&
          JSON_RESULT.data[JSON_RESULT_1ST_KEY].userErrors.length > 0
        ) {
          this._metrics.processing -= 1;
          this._metrics.errors += 1;
          return reject(new Error(
              JSON_RESULT.data[JSON_RESULT_1ST_KEY].userErrors[0].message, {
                cause: {
                  status: HTTP_STREAM_RES.status,
                  errors: false,
                  userErrors: JSON_RESULT.data[JSON_RESULT_1ST_KEY].userErrors,
                  cost: (JSON_RESULT.extensions ?
                    JSON_RESULT.extensions.cost :
                    null),
                },
              },
          ));
        }

        this._metrics.processing -= 1;
        this._metrics.success += 1;
        return resolve(JSON_RESULT);
      });
    });
  }
}
