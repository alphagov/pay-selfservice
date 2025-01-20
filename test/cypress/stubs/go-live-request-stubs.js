'use strict'

const goLiveRequestFixtures = require('../../fixtures/go-live-requests.fixture')
const { stubBuilder } = require('./stub-builder')

function postGovUkPayAgreement (opts) {
  const path = `/v1/api/services/${opts.serviceExternalId}/govuk-pay-agreement`
  return stubBuilder('POST', path, 201, {
    request: goLiveRequestFixtures.validPostGovUkPayAgreementRequest({
      user_external_id: opts.userExternalId
    }),
    response: goLiveRequestFixtures.validPostGovUkPayAgreementResponse({
      email: 'someone@example.org',
      agreementTime: '2019-02-13T11:11:16.878Z'
    })
  })
}

function postStripeAgreementIpAddress (serviceExternalId, ipAddress) {
  const path = `/v1/api/services/${serviceExternalId}/stripe-agreement`
  return stubBuilder('POST', path, 201, {
    request: {
      ip_address: ipAddress
    }
  })
}

module.exports = {
  postGovUkPayAgreement,
  postStripeAgreementIpAddress
}
