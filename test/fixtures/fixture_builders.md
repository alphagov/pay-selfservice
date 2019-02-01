# Test Fixture Builders

## Purpose

The purpose of the fixture builders is to build valid JSON for the body of requests made to, and responses expected by external APIs.

These fixtures are used throughout test code in mocks and stubs, including in [Cypress tests](../cypress/cypress_testing.md).

## Validation

The validity of the fixture builders against the contract with external APIs is maintained by using them to construct Pacts which are validated by the Pact provider. All fixture builders should be thoroughly validated through use in Pact tests so we can have confidence that other tests create stubs with a valid structure.

## Rules for writing fixture builders

Fixture builders should produce a strictly defined JSON structure which can be validated. They should not substitute in entire JSON objects provided by parameters, but should just substitute values of individual fields. They can contain conditionals for building the JSON (i.e. omitting fields based on parameters they are given) but it should be ensured there are Pact tests which test all branches of the conditionals.

Where there are shared JSON objects which appear in the request/response for multiple API endpoints, single fixture builders should be created for these, and duplication avoided to ensure they only need to be updated in a single place when the contract changes.