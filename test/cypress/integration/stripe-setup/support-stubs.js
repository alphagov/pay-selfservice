'use strict'

module.exports = {
  stubGetGatewayAccountStripeSetupSuccess: function stubGetGatewayAccountStripeSetupSuccess (gatewayAccountId, opts) {
    const stripeSetupStub = {
      name: 'getGatewayAccountStripeSetupSuccess',
      opts: {
        gateway_account_id: gatewayAccountId,
        vat_number: opts.vatNumberCompleted || false,
        company_number: opts.companyNumberCompleted || false
      }
    }
    return stripeSetupStub
  },
  stubStripeAccountGet: function stubStripeAccountGet (gatewayAccountId, stripeAccountId) {
    const stripeAccountStub = {
      name: 'getStripeAccountSuccess',
      opts: {
        gateway_account_id: gatewayAccountId,
        stripe_account_id: stripeAccountId
      }
    }
    return stripeAccountStub
  },
  stubStripeSetupGetForMultipleCallsAndCompanyNumberCompleted:
    function stubStripeSetupGetForMultipleCallsAndCompanyNumberCompleted (gatewayAccountId, ...companyNumberCompleted) {
      const data = companyNumberCompleted.map(completed => (
        {
          company_number: completed
        }
      ))
      const stripeCompanyNumberFlagStub = {
        name: 'getGatewayAccountStripeSetupFlagChanged',
        opts: {
          gateway_account_id: gatewayAccountId,
          data: data
        }
      }
      return stripeCompanyNumberFlagStub
    },
  stubStripeSetupGetForMultipleCallsAndVatNumberCompleted:
    function stubStripeSetupGetForMultipleCallsAndCompanyNumberCompleted (gatewayAccountId, ...vatNumberCompleted) {
      const data = vatNumberCompleted.map(completed => (
        {
          vat_number: completed
        }
      ))
      const stripeVatNumberFlagStub = {
        name: 'getGatewayAccountStripeSetupFlagChanged',
        opts: {
          gateway_account_id: gatewayAccountId,
          data: data
        }
      }
      return stripeVatNumberFlagStub
    }
}
