function cancelAgreementRequest (opts = {}) {
  return {
    gatewayAccountId: opts.gatewayAccountId || 3456,
    agreementId: opts.agreementId || 3333,
    payload: {
      user_email: opts.email || 'test@test.gov.uk',
      user_external_id: opts.userExternalId || 'a-user-external-id'
    }
  }
}

function cancelAgreementResponse (opts = {}) {
  return {}
}
module.exports = {
  cancelAgreementRequest, cancelAgreementResponse
}
