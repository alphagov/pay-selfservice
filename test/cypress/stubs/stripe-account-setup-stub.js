'use strict'

const stripeAccountSetupFixtures = require('../../fixtures/stripe-account-setup.fixtures')
const { stubBuilder } = require('./stub-builder')

function getGatewayAccountStripeSetupSuccess (opts) {
  let fixtureOpts = {
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
  if (opts.additionalKycData !== undefined) {
    fixtureOpts.additional_kyc_data = opts.additionalKycData
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
  let data

  if (opts.companyNumber) {
    data = opts.companyNumber.map(completed => (
      {
        company_number: completed
      }
    ))
  }
  if (opts.vatNumber) {
    data = opts.vatNumber.map(completed => (
      {
        vat_number: completed
      }
    ))
  }
  if (opts.bankAccount) {
    data = opts.bankAccount.map(completed => (
      {
        bank_account: completed
      }
    ))
  }
  if (opts.responsiblePerson) {
    data = opts.responsiblePerson.map(completed => (
      {
        responsible_person: completed
      }
    ))
  }
  if (opts.director) {
    data = opts.director.map(completed => (
      {
        director: completed
      }
    ))
  }
  if (opts.governmentEntityDocument) {
    data = opts.governmentEntityDocument.map(completed => (
      {
        government_entity_document: completed
      }
    ))
  }

  const responses = []
  data.forEach(item => {
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
          'Accept': 'application/json'
        }
      }
    }],
    responses
  }
}

module.exports = {
  getGatewayAccountStripeSetupSuccess,
  getGatewayAccountStripeSetupFlagForMultipleCalls
}
