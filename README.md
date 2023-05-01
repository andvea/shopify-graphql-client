# Shopify GraphQL Client

⚠️ This project is still in beta, so use it conscientiously. 

This is a JavaScript module that allows you to invoke Shopify's GraphQL API with Node 
without having to worry about all the tedious stuff like retries, 
throttling, backoff time and more. The purpose is to abstract all the best practices 
necessary for a healthy intensive use of the Shopify GraphQL APIs, 
so that you can take care of the rest.
<br/><br/>
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
- Queue *(Work in progress)*
- Cache *(Work in progress)*
- Metrics *(Work in progress)*

## Table of Contents
- Installation
- Configuration
- Usage
- Tests
- Roadmap
- Getting help
- Contribution
- Credits

## Getting help
Feel free to [open an issue](https://github.com/andvea/shopify-graphql-client/issues/new) 
if you have any problem.