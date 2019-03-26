'use strict'

module.exports = {
  stubGetGatewayAccountStripeSetupSuccess: function stubGetGatewayAccountStripeSetupSuccess (gatewayAccountId, vatNumberCompanyNumberCompleted) {
    const stripeSetupStub = {
      name: 'getGatewayAccountStripeSetupSuccess',
      opts: {
        gateway_account_id: gatewayAccountId,
        vat_number_company_number: vatNumberCompanyNumberCompleted
      }
    }
    return stripeSetupStub
  },
  stubGetStripeAccountSuccess: function stubGetStripeAccountSuccess (gatewayAccountId, stripeAccountId) {
    const stripeAccountStub = {
      name: 'getStripeAccountSuccess',
      opts: {
        gateway_account_id: gatewayAccountId,
        stripe_account_id: stripeAccountId
      }
    }
    return stripeAccountStub
  },
  stubGetGatewayAccountStripeSetupVatNumberCompanyNumberFlagChanged: function stubGetGatewayAccountStripeSetupVatNumberCompanyNumberFlagChanged (gatewayAccountId, ...vatNumberCompanyNumberCompleted) {
    const data = vatNumberCompanyNumberCompleted.map(completed => (
      {
        vat_number_company_number: completed
      }
    ))
    const stripeVatNumberCompanyNumberFlagStub = {
      name: 'getGatewayAccountStripeSetupFlagChanged',
      opts: {
        gateway_account_id: gatewayAccountId,
        data: data
      }
    }
    return stripeVatNumberCompanyNumberFlagStub
  }
}
