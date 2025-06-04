const userStubs = require('@test/cypress/stubs/user-stubs')
const ROLES = require('@test/fixtures/roles.fixtures')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const transactionsSummaryStubs = require('@test/cypress/stubs/transaction-summary-stubs')
const stripeAccountSetupStubs = require('@test/cypress/stubs/stripe-account-setup-stub')

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const GATEWAY_ACCOUNT_EXTERNAL_ID = 'gatewayaccount789ghi'
const GATEWAY_ACCOUNT_ID = 11

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
    transactionsSummaryStubs.getDashboardStatistics(),
    stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      responsiblePerson: false,
      bankAccount: false,
      vatNumber: false,
      companyNumber: false
    }),
  ])
}

describe('test with your users', () => {
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

      it('should be possible to access the "Test with you users" page', () => {
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/dashboard`)
        cy.contains('a', 'Test with your users').click()
        cy.location('pathname').should('eq', `/account/${GATEWAY_ACCOUNT_EXTERNAL_ID}/test-with-your-users`)
      })
    })

    describe('for an admin user', () => {
      beforeEach(() => {
        setupStubs({
          role: 'admin',
        })
      })

      it('should be possible to access the "Test with you users" page', () => {
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/dashboard`)
        cy.contains('a', 'Test with your users').click()
        cy.location('pathname').should('eq', `/account/${GATEWAY_ACCOUNT_EXTERNAL_ID}/test-with-your-users`)
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

      it('should be possible to access the "Test with you users" page', () => {
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/dashboard`)
        cy.contains('a', 'Test with your users').click()
        cy.location('pathname').should('eq', `/account/${GATEWAY_ACCOUNT_EXTERNAL_ID}/test-with-your-users`)
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

      it('should be possible to access the "Test with you users" page', () => {
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/dashboard`)
        cy.contains('a', 'Test with your users').click()
        cy.location('pathname').should('eq', `/account/${GATEWAY_ACCOUNT_EXTERNAL_ID}/test-with-your-users`)
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

      it('should not be possible to access the "Test with you users" page', () => {
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/live/dashboard`)
        cy.contains('a', 'Test with your users').should('not.exist')

        cy.request({
          url: `/account/${GATEWAY_ACCOUNT_EXTERNAL_ID}/test-with-your-users`,
          failOnStatusCode: false,
        }).then((response) => expect(response.status).to.eq(404))    })
    })

    describe('for a worldpay test account', () => {
    beforeEach(() => {
      setupStubs({
        role: 'admin',
        paymentProvider: 'worldpay',
        type: 'test'
      })
    })

    it('should not be possible to access the "Test with you users" page', () => {
      cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/dashboard`)
      cy.get('a').contains( 'Test with your users').should('not.exist')

      cy.request({
        url: `/account/${GATEWAY_ACCOUNT_EXTERNAL_ID}/test-with-your-users`,
        failOnStatusCode: false,
      }).then((response) => expect(response.status).to.eq(404))
    })
  })

  })

  describe('test with your users page', () => {
    beforeEach(() => {
      setupStubs()
    })

    it('should show the mock card number by default', () => {
      cy.visit(`/account/${GATEWAY_ACCOUNT_EXTERNAL_ID}/test-with-your-users`)

      cy.contains('div', '4000056655665556').should('exist')
    })

    it('should link to the existing prototype links page', () => {
      cy.visit(`/account/${GATEWAY_ACCOUNT_EXTERNAL_ID}/test-with-your-users`)

      cy.contains('a', 'Prototype links').should('exist').click()

      cy.location('pathname').should('eq', `/account/${GATEWAY_ACCOUNT_EXTERNAL_ID}/test-with-your-users/links`)
    })

    it('should link to the "create prototype links" page', () => {
      cy.visit(`/account/${GATEWAY_ACCOUNT_EXTERNAL_ID}/test-with-your-users`)

      cy.contains('a.govuk-button', 'Create prototype link').click()

      cy.location('pathname').should('eq', `/account/${GATEWAY_ACCOUNT_EXTERNAL_ID}/test-with-your-users/create`)
    })
  })

})
