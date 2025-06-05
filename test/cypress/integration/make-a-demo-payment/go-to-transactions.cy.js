const userStubs = require('@test/cypress/stubs/user-stubs')
const ROLES = require('@test/fixtures/roles.fixtures')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const stripeAccountSetupStubs = require('@test/cypress/stubs/stripe-account-setup-stub')
const transactionStubs = require('@test/cypress/stubs/transaction-stubs')
const productsStubs = require('@test/cypress/stubs/products-stubs')


const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const GATEWAY_ACCOUNT_EXTERNAL_ID = 'gatewayaccount789ghi'
const GATEWAY_ACCOUNT_ID = 11
const PRODUCT_EXTERNAL_ID = 'product123abc'

const setupStubs = (options = {}) => {
  cy.task('setupStubs', [
    userStubs.getUserSuccess({
      userExternalId: USER_EXTERNAL_ID,
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      serviceName: { en: 'My cool service' },
      serviceExternalId: SERVICE_EXTERNAL_ID,
      role: ROLES[options.role || 'admin'],
    }),
    gatewayAccountStubs.getGatewayAccountSuccess({
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      gatewayAccountExternalId: GATEWAY_ACCOUNT_EXTERNAL_ID,
      paymentProvider: options.paymentProvider || 'sandbox',
      type: options.type || 'test'
    }),
    gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      gatewayAccountExternalId: GATEWAY_ACCOUNT_EXTERNAL_ID,
      paymentProvider: options.paymentProvider || 'sandbox',
      type: options.type || 'test'
    }),
    productsStubs.getProductByExternalId(PRODUCT_EXTERNAL_ID, {
      gateway_account_id: GATEWAY_ACCOUNT_ID
    }),
    transactionStubs.getLedgerTransactionsSuccess({
      gatewayAccountId: GATEWAY_ACCOUNT_ID
    }),
    gatewayAccountStubs.getCardTypesSuccess()
  ])
}

describe('go to transactions redirect tests', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
    setupStubs()
  })

  it('should redirect to the transactions for the gateway account associated with the payment link', () => {
    cy.visit(`/make-a-demo-payment/${PRODUCT_EXTERNAL_ID}/go-to-transactions`)

    cy.location('pathname').should('eq', `/account/${GATEWAY_ACCOUNT_EXTERNAL_ID}/transactions`)
  })
})
