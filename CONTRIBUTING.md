# Contributing guide
Thank you for investing your time in contributing to our project!<br/>
<!-- Read our [Code of Conduct](./CODE_OF_CONDUCT.md) to keep our community approachable and respectable. -->
In this guide you will get an overview of the contribution workflow from opening an issue, creating a PR, reviewing and merging the PR.<br/>
Use the table of contents icon on the top right corner of this document to get to a specific section of this guide quickly.

## New contributor guide
To get an overview of the project, read the [Readme](README.md).<br/>
Here are some resources to help you get started with open source contributions:

- [Finding ways to contribute to open source on GitHub](https://docs.github.com/en/get-started/exploring-projects-on-github/finding-ways-to-contribute-to-open-source-on-github)
- [Set up Git](https://docs.github.com/en/get-started/quickstart/set-up-git)
- [GitHub flow](https://docs.github.com/en/get-started/quickstart/github-flow)
- [Collaborating with pull requests](https://docs.github.com/en/github/collaborating-with-pull-requests)

## Issues

### Create a new issue
If you spot a problem, [search if an issue already exists](https://docs.github.com/en/github/searching-for-information-on-github/searching-on-github/searching-issues-and-pull-requests#search-by-the-title-body-or-comments). If a related issue doesn't exist, you can open a [new issue](https://github.com/andvea/shopify-graphql-client/issues/new).

### Solve an issue
Scan through our [existing issues](https://github.com/andvea/shopify-graphql-client/issues) to find one that interests you. As a general rule, we don’t assign issues to anyone, so if you find an issue to work on, you are welcome to open a PR with a fix.

## Make Changes
1. [Fork the repository](https://docs.github.com/en/github/getting-started-with-github/fork-a-repo#fork-an-example-repository) so that you can make your changes without affecting the original project until you're ready to merge them.
2. Create a working branch and start with your changes!

## Tests
Don't forget to run `npm test` often and make sure it succeed, because 
your PR will be merged only if all the automatic tests are successful. These include:
- static code analysis via [eslint](https://eslint.org/)
- unit and integration tests via [mocha](https://mochajs.org/)

If you make a major change or fix a bug, add a related test.

Unit and integration tests are built using [mocha](https://mochajs.org/) and 
can be found in test folder.<br/>To run the test suite, please follow these steps:
1. get a valid [API key](https://shopify.dev/docs/api/admin-graphql#authentication) 
for your shop
2. clone this repository:
  ```
  gh repo clone andvea/shopify-graphql-client
  cd shopify-graphql-client
  ```
3. create the env file `.env.test` in the main folder with these parameters:
  ```
  SHOP_MYSHOPIFY_DOMAIN = test.myshopify.com (your myshopify domain)
  SHOP_API_KEY = shpca...b32 (your api key)
  ```
4. run ```npm test```

## Commit your update
Commit the changes once you are happy with them and all the automatic tests are successful.

## Pull Request
When you're finished with the changes, create a pull request, also known as a PR.
- Don't forget to [link PR to issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue).
- Enable the checkbox to [allow maintainer edits](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/allowing-changes-to-a-pull-request-branch-created-from-a-fork) so the branch can be updated for a merge.
Once you submit your PR, someone will review your proposal. We may ask questions or request additional information.
- We may ask for changes to be made before a PR can be merged, either using [suggested changes](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/incorporating-feedback-in-your-pull-request) or pull request comments. You can make any changes in your fork, then commit them to your branch.
- As you update your PR and apply changes, mark each conversation as [resolved](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/commenting-on-a-pull-request#resolving-conversations).
- If you run into any merge issues, checkout this [git tutorial](https://github.com/skills/resolve-merge-conflicts) to help you resolve merge conflicts and other issues.

## Your PR is merged!
Congratulations and welcome aboard :tada::tada:<br/>
Once your PR is merged, your contributions will be publicly visible.
