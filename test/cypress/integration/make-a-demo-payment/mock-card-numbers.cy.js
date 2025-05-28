const userStubs = require('@test/cypress/stubs/user-stubs')
const ROLES = require('@test/fixtures/roles.fixtures')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const stripeAccountSetupStubs = require('@test/cypress/stubs/stripe-account-setup-stub')
const apiKeysStubs = require('@test/cypress/stubs/api-keys-stubs')
const productsStubs = require('@test/cypress/stubs/products-stubs')


const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const GATEWAY_ACCOUNT_EXTERNAL_ID = 'gatewayaccount789ghi'
const GATEWAY_ACCOUNT_ID = 11
const USER_EMAIL = 'homer@simpson.com'
const API_KEY_TOKEN = 'TOKEN1234'
const PAYMENT_LINK_EXTERNAL_ID = 'paymentlink123abc'

const setupStubs = (options = {}) => {
  cy.task('setupStubs', [
    userStubs.getUserSuccess({
      userExternalId: USER_EXTERNAL_ID,
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      serviceName: { en: 'My cool service' },
      serviceExternalId: SERVICE_EXTERNAL_ID,
      role: ROLES[options.role || 'admin'],
      email: USER_EMAIL,
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
    stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      responsiblePerson: false,
      bankAccount: false,
      vatNumber: false,
      companyNumber: false
    }),
    apiKeysStubs.createApiKey(GATEWAY_ACCOUNT_ID, USER_EMAIL, 'Token for Demo Payment', API_KEY_TOKEN, {
      type: 'PRODUCTS',
      serviceExternalId: SERVICE_EXTERNAL_ID,
      serviceMode: 'test'
    }),
    productsStubs.postCreateProductSuccess({
      external_id: PAYMENT_LINK_EXTERNAL_ID,
    }),
    productsStubs.getProductsByGatewayAccountIdAndTypeStub([], GATEWAY_ACCOUNT_ID, 'PROTOTYPE')
  ])
}

describe('mock card numbers page tests', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  describe('for a non-stripe account', () => {
    beforeEach(() => {
      setupStubs({
        paymentProvider: 'sandbox'
      })
    })

    it('should show the correct non-stripe mock card number', () => {
      cy.visit(`/account/${GATEWAY_ACCOUNT_EXTERNAL_ID}/make-a-demo-payment`)
      cy.contains('a', 'Continue').click()

      cy.get('h1').should('have.text', 'Mock card numbers')
      cy.get('p').contains(/^4000056655665556/)
    })
  })

  describe('for a stripe account', () => {
    beforeEach(() => {
      setupStubs({
        paymentProvider: 'stripe'
      })
    })

    it('should show the correct stripe mock card number', () => {
      cy.visit(`/account/${GATEWAY_ACCOUNT_EXTERNAL_ID}/make-a-demo-payment`)
      cy.contains('a', 'Continue').click()

      cy.get('h1').should('have.text', 'Mock card numbers')
      cy.get('p').contains(/^4000058260000005/)
    })
  })

  describe('making a demo payment', () => {
    beforeEach(() => {
      setupStubs()
    })

    it.only('should redirect to the demo payment link when clicking the "make a demo payment" button', () => {
      cy.intercept('GET', `http://products-ui.url/pay/${PAYMENT_LINK_EXTERNAL_ID}`, {
        statusCode: 200
      }).as('paymentLinkRedirect')

      cy.visit(`/account/${GATEWAY_ACCOUNT_EXTERNAL_ID}/make-a-demo-payment`)
      cy.contains('a', 'Continue').click()

      cy.contains('button', 'Make a demo payment').click()

      cy.wait('@paymentLinkRedirect')
    })
  })
})
