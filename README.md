# Shopify GraphQL Client

⚠️ This project is work in progress, there is no stable release yet

This is a JavaScript module that allows you to invoke Shopify's GraphQL API with Node 
without having to worry about all the tedious stuff like retries, 
throttling, backoff time and more. 
The purpose is to abstract all the [best practices](https://shopify.dev/docs/api/usage/rate-limits#avoiding-rate-limit-errors) 
necessary for a healthy intensive use of the Shopify GraphQL APIs, 
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
    shopUrl: 'https://test.myshopify.com/admin/api/2023-04/graphql.json',
    shopApiKey: 'shpca...b32',
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
- `shopUrl`: full API endpoint, eg `https://test.myshopify.com/admin/api/2023-04/graphql.json`
- `shopApiKey`: the shop's API key
- `retryThrottles`: whether throttled requests should be automatically retried
- `maxConcurrentRequests`: how many requests can be sent at the same time. 
This concurrency capacity refers to how many requests can be sent 
even if Shopify hasn't responded yet

## Tests
Unit and integration tests are built using [mocha](https://mochajs.org/) and 
can be found in test folder.<br/>To run the test suite, please follow these steps:
- get a valid [api key](https://shopify.dev/docs/api/admin-graphql#authentication) 
for your shop
- clone this repository
	```
	gh repo clone andvea/shopify-graphql-client
	cd shopify-graphql-client
	```
- create the env file `.env.test` in the main folder with these parameters:
	```
	SHOP_MYSHOPIFY_DOMAIN = test.myshopify.com (your myshopify domain)
	SHOP_API_KEY = shpca...b32 (your api key)
	```
- run ```npm test```

## Getting help
Feel free to open an issue if you have any problem.

## Contribution
Contributions are more than welcome: pick an existing issue or create a new one 
and then open a pull request. Just make sure that to include a description 
of the problem and how you are attempting to fix the issue.