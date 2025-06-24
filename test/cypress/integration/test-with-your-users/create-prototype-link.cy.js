const userStubs = require('@test/cypress/stubs/user-stubs')
const ROLES = require('@test/fixtures/roles.fixtures')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const apiKeysStubs = require('@test/cypress/stubs/api-keys-stubs')
const productsStubs = require('@test/cypress/stubs/products-stubs')
const stripeAccountSetupStubs = require('@test/cypress/stubs/stripe-account-setup-stub')

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const GATEWAY_ACCOUNT_EXTERNAL_ID = 'gatewayaccount789ghi'
const GATEWAY_ACCOUNT_ID = 11
const USER_EMAIL = 'homer@simpson.com'
const API_KEY_TOKEN = 'TOKEN1234'

const setupStubs = (options = {}) => {
  cy.task('setupStubs', [
    userStubs.getUserSuccess({
      userExternalId: USER_EXTERNAL_ID,
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      serviceName: { en: 'My cool service' },
      serviceExternalId: SERVICE_EXTERNAL_ID,
      role: ROLES[options.role || 'admin'],
      email: USER_EMAIL
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
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, options.type || 'test', {
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      external_id: GATEWAY_ACCOUNT_EXTERNAL_ID,
      payment_provider: options.paymentProvider || 'sandbox',
      type: options.type || 'test'
    }),
    // create api key
    apiKeysStubs.createApiKey(GATEWAY_ACCOUNT_ID, USER_EMAIL, `Token for Prototype: Test prototype link description`, API_KEY_TOKEN, {
      type: 'PRODUCTS',
      serviceExternalId: SERVICE_EXTERNAL_ID,
      serviceMode: options.type || 'test'
    }),
    // create product
    productsStubs.postCreateProductSuccess(),
    productsStubs.getProductsByGatewayAccountIdAndTypeStub([], GATEWAY_ACCOUNT_ID, 'PROTOTYPE')
  ])
}

describe('create prototype links page', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  describe('page access constraints', () => {
    describe('for a non-admin user', () => {
      beforeEach(() => {
        setupStubs({
          role: 'view-only',
        })
      })

      it('should be possible to access the "Create prototype link" page', () => {
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/test-with-your-users`)
        cy.contains('a', 'Create prototype link').should('exist').click()
        cy.location('pathname').should('eq', `/service/${SERVICE_EXTERNAL_ID}/account/test/test-with-your-users/create`)
      })
    })

    describe('for an admin user', () => {
      beforeEach(() => {
        setupStubs({
          role: 'admin',
        })
      })

      it('should be possible to access the "Create prototype link" page', () => {
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/test-with-your-users`)
        cy.contains('a', 'Create prototype link').should('exist').click()
        cy.location('pathname').should('eq', `/service/${SERVICE_EXTERNAL_ID}/account/test/test-with-your-users/create`)
      })
    })

    describe('for a stripe test account', () => {
      beforeEach(() => {
        setupStubs({
          role: 'admin',
          paymentProvider: 'stripe',
          type: 'test'
        })
      })

      it('should be possible to access the "Create prototype link" page', () => {
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/test-with-your-users`)
        cy.contains('a', 'Create prototype link').should('exist').click()
        cy.location('pathname').should('eq', `/service/${SERVICE_EXTERNAL_ID}/account/test/test-with-your-users/create`)
      })
    })

    describe('for a sandbox test account', () => {
      beforeEach(() => {
        setupStubs({
          role: 'admin',
          paymentProvider: 'sandbox',
          type: 'test'
        })
      })

      it('should be possible to access the "Create prototype link" page', () => {
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/test-with-your-users`)
        cy.contains('a', 'Create prototype link').should('exist').click()
        cy.location('pathname').should('eq', `/service/${SERVICE_EXTERNAL_ID}/account/test/test-with-your-users/create`)
      })
    })

    describe('for a live account', () => {
      beforeEach(() => {
        setupStubs({
          role: 'admin',
          paymentProvider: 'stripe',
          type: 'live'
        })
      })

      it('should not be possible to access the "Create prototype link" page', () => {
        cy.request({
          url: `/service/${SERVICE_EXTERNAL_ID}/account/live/test-with-your-users/create`,
          failOnStatusCode: false,
        }).then((response) => expect(response.status).to.eq(404))
      })
    })

    describe('for a worldpay test account', () => {
      beforeEach(() => {
        setupStubs({
          role: 'admin',
          paymentProvider: 'worldpay',
          type: 'test'
        })
      })

      it('should not be possible to access the "Create prototype link" page', () => {
        cy.request({
          url: `/service/${SERVICE_EXTERNAL_ID}/account/test/test-with-your-users/create`,
          failOnStatusCode: false,
        }).then((response) => expect(response.status).to.eq(404))
      })
    })
  })

  describe('input validation', () => {
    beforeEach(() => {
      setupStubs()
    })

    it('should return an error if no description is entered', () => {
      cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/test-with-your-users/create`)

      cy.contains('button', 'Create prototype link').click()
      cy.location('pathname').should('eq', `/service/${SERVICE_EXTERNAL_ID}/account/test/test-with-your-users/create`)

      cy.get('.flash-container>.generic-error')
        .should('contain.text', 'Enter a description')
    })

    it('should return an error if no amount is entered', () => {
      cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/test-with-your-users/create`)
      cy.get('input#prototyping__links-input-description').type('Test prototype link description', { delay: 0 })

      cy.contains('button', 'Create prototype link').click()
      cy.location('pathname').should('eq', `/service/${SERVICE_EXTERNAL_ID}/account/test/test-with-your-users/create`)

      cy.get('.flash-container>.generic-error')
        .should('contain.text', 'Enter an amount in pounds and pence using digits and a decimal point. For example “10.50”')
    })

    it('should return an error if the amount is too high', () => {
      cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/test-with-your-users/create`)
      cy.get('input#prototyping__links-input-description').type('Test prototype link description', { delay: 0 })
      cy.get('input#prototyping__links-input-amount').type('100000.01', { delay: 0 })

      cy.contains('button', 'Create prototype link').click()
      cy.location('pathname').should('eq', `/service/${SERVICE_EXTERNAL_ID}/account/test/test-with-your-users/create`)

      cy.get('.flash-container>.generic-error')
        .should('contain.text', 'Enter an amount under £100,000')
    })

    it('should return an error if no confirmation page URL is entered', () => {
      cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/test-with-your-users/create`)
      cy.get('input#prototyping__links-input-description').type('Test prototype link description', { delay: 0 })
      cy.get('input#prototyping__links-input-amount').type('100.00', { delay: 0 })

      cy.contains('button', 'Create prototype link').click()
      cy.location('pathname').should('eq', `/service/${SERVICE_EXTERNAL_ID}/account/test/test-with-your-users/create`)

      cy.get('.flash-container>.generic-error')
        .should('contain.text', 'URL must begin with https://')
    })

    it('should return an error if the confirmation page URL is not https', () => {
      cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/test-with-your-users/create`)
      cy.get('input#prototyping__links-input-description').type('Test prototype link description', { delay: 0 })
      cy.get('input#prototyping__links-input-amount').type('100.00', { delay: 0 })
      cy.get('input#prototyping__links-input-confirmation-page').type('http://www.gov.uk', { delay: 0 })

      cy.contains('button', 'Create prototype link').click()
      cy.location('pathname').should('eq', `/service/${SERVICE_EXTERNAL_ID}/account/test/test-with-your-users/create`)

      cy.get('.flash-container>.generic-error')
        .should('contain.text', 'URL must begin with https://')
    })
  })

  describe('creating a prototype link', () => {
    beforeEach(() => {
      setupStubs()
    })

    it('should redirect to the "Your prototype link" page', () => {
      cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/test-with-your-users/create`)
      cy.get('input#prototyping__links-input-description').type('Test prototype link description', { delay: 0 })
      cy.get('input#prototyping__links-input-amount').type('100.00', { delay: 0 })
      cy.get('input#prototyping__links-input-confirmation-page').type('https://www.gov.uk', { delay: 0 })

      cy.contains('button', 'Create prototype link').click()
      cy.location('pathname').should('eq', `/service/${SERVICE_EXTERNAL_ID}/account/test/test-with-your-users/confirm`)

      cy.contains('a', 'http://products-ui.url/pay/cf3hp2')
        .should('have.attr', 'href', 'http://products-ui.url/pay/cf3hp2')

      cy.contains('a', 'See prototype links').click()

      cy.location('pathname').should('eq', `/service/${SERVICE_EXTERNAL_ID}/account/test/test-with-your-users/links`)
    })
  })
})
