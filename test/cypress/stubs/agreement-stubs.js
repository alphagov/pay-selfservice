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

module.exports = {
  getLedgerAgreementsSuccess
}
