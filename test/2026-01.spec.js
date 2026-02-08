import supertest from 'supertest';
import assert from 'node:assert';
import * as dotenv from 'dotenv';
import {ShopifyGraphQL} from '../ShopifyGraphQL.js';

dotenv.config({
  path: './.env.test'
});

const SHOPIFY_API_VERSION = '2026-01';

var shopifyGraphQL =
  new ShopifyGraphQL({
    timeout: 2,
    apiEndpoint: 'https://'+process.env.SHOP_MYSHOPIFY_DOMAIN+'/admin/api/'+SHOPIFY_API_VERSION+'/graphql.json',
    apiKey: process.env.SHOP_API_KEY,
    retryThrottles: false,
    maxConcurrentRequests: 50
  });

describe('['+SHOPIFY_API_VERSION+'] GraphQL Errors', function() {
  this.timeout(55000);

  it('User-Agent version equal to package.json', (done) => {
    const regex = 
      /\((?<info>.*?)\)(\s|$)|(?<name>.*?)\/(?<version>.*?)(\s|$)/gm;
    var userAgentVersion = regex.exec(shopifyGraphQL.userAgent).groups.version;

    if (process.env.npm_package_version==userAgentVersion) {
      done();
    } else {
      done(new Error('Wrong User-Agent version'));
    }
  });

  it('Succesfull request', (done) => {
    shopifyGraphQL.request(JSON.stringify({
      query: `{ 
        shop { 
          id 
        } 
      }`
    })).then((v) => {
      done();
    }).catch((reqErr) => {
      done(new Error(reqErr));
    });
  });

  it('Reject if response is not between 200 and 299', (done) => {
    shopifyGraphQL.request(``).then((v) => {
      done(new Error('Reponse with wrong status code passed'));
    }).catch((reqErr) => {
      done();
    });
  });

  it('Reject if response has errors', (done) => {
    shopifyGraphQL.request(JSON.stringify({
      query: `{ 
        _customer(id: "gid://shopify/Customer/xxx") { 
          createdAt 
        } 
      }`
    })).then((v) => {
      done(new Error('Malformed body passed'));
    }).catch((err) => {
      if (!err.cause.userErrors && err.cause.errors) {
        done();
      } else {
        done(new Error('Errors param is not defined'));
      }
    });
  });

  it('Reject if response has userErrors', (done) => {
    shopifyGraphQL.request(JSON.stringify({
      query: `mutation webhookSubscriptionDelete($id: ID!) {
        webhookSubscriptionDelete(id: $id) { 
          userErrors { 
            field 
            message 
          } 
        } 
      }`,
      variables: {id: 'gid://shopify/WebhookSubscription/xxx'}
    })).then((v) => {
      done(new Error('Malformed mutation input passed'));
    }).catch((err) => {
      if (err.cause.userErrors && !err.cause.errors) {
        done();
      } else {
        console.log(err);
        done(new Error('userErrors param is not defined'));
      }
    });
  });

  it('At least one request throttled', (done) => {
    var throttlingPromises = [];
    for (var i=0; i<5000; i++) {
      throttlingPromises.push(
        shopifyGraphQL.request(JSON.stringify({
          query: `{ 
            shop{ 
              myshopifyDomain 
              alerts{ action{ title } } 
              currencySettings(first:10){ edges{ node{ currencyName } } } 
              storefrontAccessTokens(first:10){ edges{ node { createdAt } } } 
              metafields(first:10){ edges{ node{ id } } } 
            } 
          }`
        })));
    }

    Promise.all(throttlingPromises).then((success) => {
      done(new Error('No throttled requests'));
    }).catch((err) => {
      if (err.cause.status=='throttled') {
        done();
      } else {
        done(new Error('No throttled requests'));
      }
    });
  });

  it('Automatically retry throttled requests', (done) => {
    shopifyGraphQL =
      new ShopifyGraphQL({
        timeout: 2,
        apiEndpoint: 'https://'+process.env.SHOP_MYSHOPIFY_DOMAIN+'/admin/api/'+SHOPIFY_API_VERSION+'/graphql.json',
        apiKey: process.env.SHOP_API_KEY,
        maxConcurrentRequests: 5,
        retryThrottles: true
      });

    var throttlingPromises = [];
    for (var i=0; i<70; i++) {
      throttlingPromises.push(
        shopifyGraphQL.request(JSON.stringify({
          query:`{ 
            shop{ 
              myshopifyDomain 
              alerts{ action{ title } } 
              currencySettings(first:10){ edges{ node{ currencyName } } } 
              storefrontAccessTokens(first:10){ edges{ node { createdAt } } } 
              metafields(first:10){ edges{ node{ id } } } 
            } 
          }`
        })));
    }

    Promise.all(throttlingPromises).then((success) => {
      var _check = true;
      for (var i=0; i<success.length; i++) {
        if (success[i].data.shop.myshopifyDomain!=process.env.SHOP_MYSHOPIFY_DOMAIN) {
          _check = false;
        }
      }
      if (_check) {
        done();
      } else {
        done(new Error('An error occurred with one or more requests'));
      }
    }).catch((promiseError) => {
      done(new Error(promiseError));
    });
  });
});