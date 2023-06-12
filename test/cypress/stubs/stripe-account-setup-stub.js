'use strict'

const stripeAccountSetupFixtures = require('../../fixtures/stripe-account-setup.fixtures')
const { stubBuilder } = require('./stub-builder')

function getGatewayAccountStripeSetupSuccess (opts) {
  const fixtureOpts = {
    gateway_account_id: opts.gatewayAccountId
  }

  if (opts.responsiblePerson !== undefined) {
    fixtureOpts.responsible_person = opts.responsiblePerson
  }
  if (opts.bankAccount !== undefined) {
    fixtureOpts.bank_account = opts.bankAccount
  }
  if (opts.vatNumber !== undefined) {
    fixtureOpts.vat_number = opts.vatNumber
  }
  if (opts.companyNumber !== undefined) {
    fixtureOpts.company_number = opts.companyNumber
  }
  if (opts.director !== undefined) {
    fixtureOpts.director = opts.director
  }
  if (opts.organisationDetails !== undefined) {
    fixtureOpts.organisation_details = opts.organisationDetails
  }
  if (opts.governmentEntityDocument !== undefined) {
    fixtureOpts.government_entity_document = opts.governmentEntityDocument
  }

  const path = `/v1/api/accounts/${opts.gatewayAccountId}/stripe-setup`
  return stubBuilder('GET', path, 200, {
    response: stripeAccountSetupFixtures.buildGetStripeAccountSetupResponse(fixtureOpts)
  })
}

function getGatewayAccountStripeSetupFlagForMultipleCalls (opts) {
  const stripeSetupStepOptions = {}

  if (opts.companyNumber) {
    stripeSetupStepOptions.company_number = opts.companyNumber.map(completed => (
      {
        company_number: completed
      }
    ))
  }
  if (opts.vatNumber) {
    stripeSetupStepOptions.vat_number = opts.vatNumber.map(completed => (
      {
        vat_number: completed
      }
    ))
  }
  if (opts.bankAccount) {
    stripeSetupStepOptions.bank_account = opts.bankAccount.map(completed => (
      {
        bank_account: completed
      }
    ))
  }
  if (opts.responsiblePerson) {
    stripeSetupStepOptions.responsible_person = opts.responsiblePerson.map(completed => (
      {
        responsible_person: completed
      }
    ))
  }
  if (opts.director) {
    stripeSetupStepOptions.director = opts.director.map(completed => (
      {
        director: completed
      }
    ))
  }
  if (opts.governmentEntityDocument) {
    stripeSetupStepOptions.government_entity_document = opts.governmentEntityDocument.map(completed => (
      {
        government_entity_document: completed
      }
    ))
  }
  if (opts.organisationDetails) {
    stripeSetupStepOptions.organisation_details = opts.organisationDetails.map(completed => (
      {
        organisation_details: completed
      }
    ))
  }

  const optionKeys = Object.keys(stripeSetupStepOptions)
  const numberOfStripeSetupCalls = stripeSetupStepOptions[optionKeys[0]].length

  const allStripeCallResponsesArray = []

  for (let i = 0; i < numberOfStripeSetupCalls; i++) {
    const singleStripeCallResponse = {}

    optionKeys.forEach(function (key) {
      const option = stripeSetupStepOptions[key]
      const optionInstance = option[i]
      singleStripeCallResponse[key] = optionInstance[key]
    })

    allStripeCallResponsesArray[i] = singleStripeCallResponse
  }

  const responses = []

  allStripeCallResponsesArray.forEach(item => {
    responses.push({
      is: {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: stripeAccountSetupFixtures.buildGetStripeAccountSetupResponse(item)
      }
    })
  })

  return {
    predicates: [{
      equals: {
        method: 'GET',
        path: `/v1/api/accounts/${opts.gatewayAccountId}/stripe-setup`,
        headers: {
          Accept: 'application/json'
        }
      }
    }],
    responses
  }
}

function patchUpdateStripeSetupSuccess (gatewayAccountId) {
  const path = `/v1/api/accounts/${gatewayAccountId}/stripe-setup`
  return stubBuilder('PATCH', path, 200)
}

module.exports = {
  getGatewayAccountStripeSetupSuccess,
  getGatewayAccountStripeSetupFlagForMultipleCalls,
  patchUpdateStripeSetupSuccess
}
