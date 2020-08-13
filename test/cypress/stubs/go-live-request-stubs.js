const postGovUkPayAgreement = function (opts) {
  return {
    name: 'postGovUkPayAgreement',
    opts: {
      external_id: opts.serviceExternalId,
      user_external_id: opts.userExternalId,
      email: 'someone@example.org',
      agreementTime: '2019-02-13T11:11:16.878Z'
    }
  }
}

const postStripeAgreementIpAddress = function (opts) {
  return {
    name: 'postStripeAgreementIpAddress',
    opts: {
      external_id: opts.serviceExternalId,
      ip_address: '93.184.216.34'
    }
  }
}

module.exports = {
  postGovUkPayAgreement,
  postStripeAgreementIpAddress
}
