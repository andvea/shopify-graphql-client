# Shopify GraphQL Client

⚠️ This project is still in beta, so use it conscientiously. 

This is a JavaScript module that allows you to invoke Shopify's GraphQL API with Node 
without having to worry about all the tedious stuff like retries, 
throttling, backoff time and more. The purpose is to abstract all the best practices 
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
- **Automatic retry**: 
- **Queue**: 
- Cache *(Work in progress)*
- Metrics *(Work in progress)*

## Table of Contents
- [Installation](#Installation)
- [Usage](#Usage)
- [Tests](#Tests)
- [Getting help](#Getting%20help)
- [Contribution](#Contribution)

## Installation
You can install the library via npm
```
npm install @andvea/shopify-graphql-client --save
```

## Usage

## Tests
Unit and integration tests are built using [mocha](https://mochajs.org/) and can be found in test folder.
To run the test suite, first clone this repository, then run npm test:
```
gh repo clone andvea/shopify-graphql-client
cd shopify-graphql-client
npm test
```

## Getting help
Feel free to open an issue if you have any problem.

## Contribution
Contributions are more than welcome: pick an existing issue or create a new one 
and then open a pull request. Just make sure that to include a description 
of the problem and how you are attempting to fix the issue.