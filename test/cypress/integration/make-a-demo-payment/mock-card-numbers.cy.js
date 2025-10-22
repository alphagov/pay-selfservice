const userStubs = require('@test/cypress/stubs/user-stubs')
const ROLES = require('@test/fixtures/roles.fixtures')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const apiKeysStubs = require('@test/cypress/stubs/api-keys-stubs')
const productsStubs = require('@test/cypress/stubs/products-stubs')

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const GATEWAY_ACCOUNT_EXTERNAL_ID = 'gatewayaccount789ghi'
const GATEWAY_ACCOUNT_ID = '11'
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
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, options.type || 'test', {
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      external_id: GATEWAY_ACCOUNT_EXTERNAL_ID,
      payment_provider: options.paymentProvider || 'sandbox',
      type: options.type || 'test',
    }),
    apiKeysStubs.createApiKey(GATEWAY_ACCOUNT_ID, USER_EMAIL, 'Token for Demo Payment', API_KEY_TOKEN, {
      type: 'PRODUCTS',
      serviceExternalId: SERVICE_EXTERNAL_ID,
      serviceMode: 'test',
    }),
    productsStubs.postCreateProductSuccess({
      external_id: PAYMENT_LINK_EXTERNAL_ID,
    }),
    productsStubs.getProductsByGatewayAccountIdAndTypeStub([], GATEWAY_ACCOUNT_ID, 'PROTOTYPE'),
  ])
}

describe('mock card numbers page tests', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  describe('for a non-stripe account', () => {
    beforeEach(() => {
      setupStubs({
        paymentProvider: 'sandbox',
      })
    })

    it('should check accessibility of the page', { defaultCommandTimeout: 15000 }, () => {
      cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/demo-payment`)
      cy.contains('a', 'Continue').click()
      cy.a11yCheck()
    })

    it('should show the correct non-stripe mock card number', () => {
      cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/demo-payment`)
      cy.contains('a', 'Continue').click()
      cy.get('a.govuk-back-link').should(
        'have.attr',
        'href',
        `/service/${SERVICE_EXTERNAL_ID}/account/test/demo-payment`
      )
      cy.get('h1').should('contain.text', 'Mock card number')
      cy.get('p').contains(/^4000056655665556/)
    })
  })

  describe('for a stripe account', () => {
    beforeEach(() => {
      setupStubs({
        paymentProvider: 'stripe',
      })
    })

    it('should show the correct stripe mock card number', () => {
      cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/demo-payment`)
      cy.contains('a', 'Continue').click()
      cy.get('a.govuk-back-link').should(
        'have.attr',
        'href',
        `/service/${SERVICE_EXTERNAL_ID}/account/test/demo-payment`
      )
      cy.get('h1').should('contain.text', 'Mock card number')
      cy.get('p').contains(/^4000058260000005/)
    })
  })

  describe('making a test payment', () => {
    beforeEach(() => {
      setupStubs()
    })

    it('should redirect to the test payment link when clicking the "make a test payment" button', () => {
      cy.intercept('GET', `http://products-ui.url/pay/${PAYMENT_LINK_EXTERNAL_ID}`, {
        statusCode: 200,
      }).as('paymentLinkRedirect')

      cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/demo-payment`)
      cy.contains('a', 'Continue').click()

      cy.contains('button', 'Make a test payment').click()

      cy.wait('@paymentLinkRedirect')
    })
  })
})
