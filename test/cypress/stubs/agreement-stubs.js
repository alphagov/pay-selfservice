'use strict'

const agreementFixtures = require('../../fixtures/agreement.fixtures')
const { stubBuilder } = require('./stub-builder')

function getLedgerAgreementsSuccess (opts) {
  const path = '/v1/agreement'
  return stubBuilder('GET', path, 200, {
    query: {
      service_id: opts.service_id,
      live: opts.live,
      page: opts.page || 1
    },
    response: agreementFixtures.validAgreementSearchResponse(opts.agreements)
  })
}

function getLedgerAgreementSuccess(opts) {
  const agreement = opts.agreement || {}
  const path = `/v1/agreement/${agreement.id}`
  return stubBuilder('GET', path, 200, {
    query: {
      service_id: opts.service_id
    },
    response: agreementFixtures.validAgreementResponse(agreement)
  })
}

module.exports = {
  getLedgerAgreementsSuccess,
  getLedgerAgreementSuccess
}
