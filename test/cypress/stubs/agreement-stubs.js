'use strict'

const agreementFixtures = require('../../fixtures/agreement.fixtures')
const { stubBuilder } = require('./stub-builder')

function getLedgerAgreementsSuccess (opts) {
  const path = '/v1/agreement'
  return stubBuilder('GET', path, 200, {
    query: {
      service_id: opts.service_id,
      live: opts.live,
      account_id: opts.gatewayAccountId,
      page: opts.page || 1,
      ...opts.filters
    },
    response: agreementFixtures.validAgreementSearchResponse(opts.agreements, opts)
  })
}

function getLedgerAgreementSuccess (opts = {}) {
  const agreement = agreementFixtures.validAgreementResponse(opts)
  const path = `/v1/agreement/${agreement.external_id}`
  return stubBuilder('GET', path, 200, {
    query: {
      service_id: opts.service_id
    },
    response: agreement
  })
}

function postConnectorCancelAgreementSuccess (opts = {}) {
  const path = `/v1/api/accounts/${opts.gatewayAccountId}/agreements/${opts.external_id}/cancel`
  return stubBuilder('POST', path, 200, {
    request: {
      user_email: opts.user_email,
      user_external_id: opts.user_external_id
    }
  })
}

function postConnectorCancelAgreementFailure (opts = {}) {
  const path = `/v1/api/accounts/${opts.gatewayAccountId}/agreements/${opts.external_id}/cancel`
  return stubBuilder('POST', path, 500)
}

function postCancelAgreementByServiceExternalIdAndAccountType (opts = {}) {
  const path = `/v1/api/service/${opts.serviceExternalId}/account/${opts.accountType}/agreements/${opts.agreementExternalId}/cancel`
  return stubBuilder('POST', path, 200, {
    request: {
      user_email: opts.userEmail,
      user_external_id: opts.userExternalId
    }
  })
}

module.exports = {
  getLedgerAgreementsSuccess,
  getLedgerAgreementSuccess,
  postConnectorCancelAgreementSuccess,
  postConnectorCancelAgreementFailure,
  postCancelAgreementByServiceExternalIdAndAccountType
}
