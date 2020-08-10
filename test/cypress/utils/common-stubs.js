'use strict'

module.exports.getGatewayAccountStub = (gatewayAccountId, type = 'test', paymentProvider = 'sandbox') => {
  return {
    name: 'getGatewayAccountSuccess',
    opts: {
      gateway_account_id: gatewayAccountId,
      type: type,
      payment_provider: paymentProvider,
      requires3ds: true
    }
  }
}

module.exports.getGatewayAccountsStub = (gatewayAccountId, type = 'test', paymentProvider = 'sandbox') => {
  return {
    name: 'getGatewayAccountsSuccess',
    opts: {
      gateway_account_id: gatewayAccountId,
      type: type,
      payment_provider: paymentProvider
    }
  }
}

module.exports.getDirectDebitGatewayAccountStub = (gatewayAccountId, type = 'test', paymentProvider = 'sandbox') => {
  return {
    name: 'getDirectDebitGatewayAccountSuccess',
    opts: {
      gateway_account_id: gatewayAccountId,
      type: type,
      payment_provider: paymentProvider
    }
  }
}

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
