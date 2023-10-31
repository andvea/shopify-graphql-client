# Shopify GraphQL Client

This is a JavaScript module that allows you to invoke Shopify's GraphQL API with Node 
without having to worry about all the tedious stuff like retries, 
throttling, backoff time and more. 
The purpose is to abstract all the [best practices](https://shopify.dev/docs/api/usage/rate-limits#avoiding-rate-limit-errors) 
necessary for a healthy intensive use of the Shopify GraphQL API, 
so that you can take care of the rest.

Here you can find a list of the major benefits. Please note that some of them
are still work in progress.
- **Errors catching**: sometimes there's a mistake to fix, sometimes it's just a 
matter of time. This library recognizes these two types of errors based on 
Shopify's response and abstracts their complexity with simple responses and 
automation mechanisms.
- **Backoff timing**: the rate of your requests is automatically adjusted 
based on response's API usage metadata for smoother distribution, in order to
reduce the throttled requests.
- **Automatic retry**: you can configure the library to automatically retry 
trotthled requests.
- **Queue**: your requests are automatically placed in a FIFO queue which 
guarantees the order of execution.
- **HTTP/2 support**: all the requests are made via HTTP/2 and the session 
remains active as long as the queue is not empty. It's a mechanism that 
allows you to save time, especially with many requests in the queue.
- **No dependencies**: a lightweight solution that minimizes potential conflicts
- Cache *(Work in progress)*
- Metrics *(Work in progress)*

## Table of Contents
- [Installation](#Installation)
- [Usage](#Usage)
  - [Basic example](#Usage)
  - [Parameters](#Parameters)
- [Tests](#Tests)
- [Getting help](#Getting%20help)
- [Contribution](#Contribution)
- [Credits](#Credits)

## Installation
You can install the library via npm
```
npm install @andvea/shopify-graphql-client --save
```

## Usage
This is a basic example of using the library:
```javascript
import {ShopifyGraphQL} from '@andvea/shopify-graphql-client';

var shopifyGraphQL =
  new ShopifyGraphQL({
    apiEndpoint: 'https://test.myshopify.com/admin/api/2023-04/graphql.json',
    apiKey: 'shpca...b32',
    retryThrottles: true,
    maxConcurrentRequests: 5
  });

try {
  var shopifyResponse = 
    await shopifyGraphQL.request(`{ 
      shop { 
        id 
      } 
    }`);
    
  console.log(shopifyResponse);
} catch(reqErr) {
  console.log('Something went wrong!');
  console.log(reqErr);
}
```

### Parameters
- `apiEndpoint`: full API endpoint, eg `https://test.myshopify.com/admin/api/2023-04/graphql.json`
- `apiKey`: the shop's API key
- `retryThrottles`: whether throttled requests should be automatically retried
- `maxConcurrentRequests`: how many requests can be sent at the same time. 
This concurrency capacity refers to how many requests can be sent 
even if Shopify hasn't responded yet

## Tests
To get an overview of tests, read the [related section in the Contributing guide](CONTRIBUTING.md#tests).

## Getting help
Feel free to open [an issue](https://github.com/andvea/shopify-graphql-client/issues/new) if you have any problem.

## Contribution
Contributions are more than welcome. To learn more about, read the [Contributing guide](CONTRIBUTING.md).

## Credits
My thanks go to my friends at [Uppa](https://www.uppa.it/).<br/>
Aiming to build a better world is an attitude I learnt from them:<br/>
_Chiara B., Chiara R., Claudia L.G., Daniela M., Francesca G., Giulia B., 
Lidia D., Lorenzo B., Lorenzo C., Pierpaolo D.M., Sergio C.N., Virginia V._
