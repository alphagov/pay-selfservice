'use strict'

module.exports.getDashboardStatisticsStub = () => {
  return {
    name: 'getDashboardStatisticsStub',
    opts: {}
  }
}

module.exports.getGatewayAccountStripeSetupSuccess = (gatewayAccountId, bankAccount, responsiblePerson, vatNumber, companyNumber) => {
  const stripeSetupStub = {
    name: 'getGatewayAccountStripeSetupSuccess',
    opts: {
      gateway_account_id: gatewayAccountId,
      bank_account: bankAccount,
      responsible_person: responsiblePerson,
      vat_number: vatNumber,
      company_number: companyNumber
    }
  }
  return stripeSetupStub
}

module.exports.getStripeAccount = (gatewayAccountId, stripeAccountId) => {
  const stripeAccountStub = {
    name: 'getStripeAccountSuccess',
    opts: {
      gateway_account_id: gatewayAccountId,
      stripe_account_id: stripeAccountId
    }
  }
  return stripeAccountStub
}
