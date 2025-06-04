const userStubs = require('@test/cypress/stubs/user-stubs')
const ROLES = require('@test/fixtures/roles.fixtures')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const stripeAccountSetupStubs = require('@test/cypress/stubs/stripe-account-setup-stub')
const transactionsSummaryStubs = require('@test/cypress/stubs/transaction-summary-stubs')


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
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, options.type || 'test', {
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      external_id: GATEWAY_ACCOUNT_EXTERNAL_ID,
      payment_provider: options.paymentProvider || 'sandbox',
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

describe('make a demo payment tests', () => {
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

      it('should be possible to access the "make a demo payment" page', () => {
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/dashboard`)
        cy.contains('a', 'Make a demo payment').should('exist').click()
        cy.location('pathname').should('eq', `/account/${GATEWAY_ACCOUNT_EXTERNAL_ID}/make-a-demo-payment`)
      })
    })

    describe('for an admin user', () => {
      beforeEach(() => {
        setupStubs({
          role: 'admin',
        })
      })

      it('should be possible to access the "make a demo payment" page', () => {
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/dashboard`)
        cy.contains('a', 'Make a demo payment').should('exist').click()
        cy.location('pathname').should('eq', `/account/${GATEWAY_ACCOUNT_EXTERNAL_ID}/make-a-demo-payment`)
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

      it('should be possible to access the "make a demo payment" page', () => {
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/dashboard`)
        cy.contains('a', 'Make a demo payment').should('exist').click()
        cy.location('pathname').should('eq', `/account/${GATEWAY_ACCOUNT_EXTERNAL_ID}/make-a-demo-payment`)
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

      it('should be possible to access the "make a demo payment" page', () => {
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/dashboard`)
        cy.contains('a', 'Make a demo payment').should('exist').click()
        cy.location('pathname').should('eq', `/account/${GATEWAY_ACCOUNT_EXTERNAL_ID}/make-a-demo-payment`)
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

      it('should not be possible to access the "make a demo payment" page', () => {
        cy.request({
          url: `/account/${GATEWAY_ACCOUNT_EXTERNAL_ID}/make-a-demo-payment`,
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

      it('should not be possible to access the "make a demo payment" page', () => {
        cy.request({
          url: `/account/${GATEWAY_ACCOUNT_EXTERNAL_ID}/make-a-demo-payment`,
          failOnStatusCode: false,
        }).then((response) => expect(response.status).to.eq(404))
      })
    })
  })

  describe('edit payment description', () => {
    beforeEach(() => {
      setupStubs()
    })

    it('should allow navigate to the "edit description" page', () => {
      cy.visit(`/account/${GATEWAY_ACCOUNT_EXTERNAL_ID}/make-a-demo-payment`)

      cy.get('#payment-description').find('a').contains('Edit').click()
      cy.location('pathname').should('eq', `/account/${GATEWAY_ACCOUNT_EXTERNAL_ID}/make-a-demo-payment/edit-description`)
      cy.get('h1').should('have.text', 'Edit payment description')
      cy.get('textarea').should('have.value', 'An example payment description')
    })

    it('should show an error when submitting an empty description', () => {
      cy.visit(`/account/${GATEWAY_ACCOUNT_EXTERNAL_ID}/make-a-demo-payment`)
      cy.get('#payment-description').find('a').contains('Edit').click()

      cy.get('textarea').clear()
      cy.get('button').contains('Save changes').click()
      cy.get('.govuk-error-summary').should('exist').within(() => {
        cy.get('h2').should('contain', 'There is a problem')
        cy.get('[data-cy=error-summary-list-item]').should('have.length', 1)
        cy.get('[data-cy=error-summary-list-item]').first()
          .contains('Enter a payment description')
          .should('have.attr', 'href', '#payment-description')
      })
      cy.get('textarea').should('have.value', '')
    })

    it('should update the description when submitting a valid description', () => {
      cy.visit(`/account/${GATEWAY_ACCOUNT_EXTERNAL_ID}/make-a-demo-payment`)
      cy.get('#payment-description').find('a').contains('Edit').click()

      cy.get('textarea').clear().type('New description', { delay: 0 })
      cy.get('button').contains('Save changes').click()
      cy.get('h1').should('have.text', 'Make a demo payment')
      cy.get('#payment-description').contains('New description')
      cy.get('#payment-amount').contains('£20.00')
    })
  })

  describe('edit payment amount', () => {
    beforeEach(() => {
      setupStubs()
    })

    it('should allow navigate to the "edit payment amount" page', () => {
      cy.visit(`/account/${GATEWAY_ACCOUNT_EXTERNAL_ID}/make-a-demo-payment`)

      cy.get('#payment-amount').find('a').contains('Edit').click()
      cy.location('pathname').should('eq', `/account/${GATEWAY_ACCOUNT_EXTERNAL_ID}/make-a-demo-payment/edit-amount`)
      cy.get('h1').should('have.text', 'Edit payment amount')
      cy.get('#payment-amount').should('have.value', '20.00')
    })

    it('should show an error when submitting an invalid amount', () => {
      cy.visit(`/account/${GATEWAY_ACCOUNT_EXTERNAL_ID}/make-a-demo-payment`)
      cy.get('#payment-amount').find('a').contains('Edit').click()

      cy.get('#payment-amount').type('a')
      cy.get('button').contains('Save changes').click()
      cy.get('.govuk-error-summary').should('exist').within(() => {
        cy.get('h2').should('contain', 'There is a problem')
        cy.get('[data-cy=error-summary-list-item]').should('have.length', 1)
        cy.get('[data-cy=error-summary-list-item]').first()
          .contains('Enter an amount in pounds and pence')
          .should('have.attr', 'href', '#payment-amount')
      })
      cy.get('#payment-amount').should('have.value', '20.00')
    })

    it('should update the amount when submitting a valid amount', () => {
      cy.visit(`/account/${GATEWAY_ACCOUNT_EXTERNAL_ID}/make-a-demo-payment`)
      cy.get('#payment-amount').find('a').contains('Edit').click()

      cy.get('#payment-amount').clear().type('1.00')
      cy.get('button').contains('Save changes').click()
      cy.get('h1').should('have.text', 'Make a demo payment')
      cy.get('#payment-description').contains('An example payment description')
      cy.get('#payment-amount').contains('£1.00')
    })
  })

  describe('on form submission', () => {
    beforeEach(() => {
      setupStubs()
    })

    it('should navigate to the "mock card numbers" page', () => {
      cy.visit(`/account/${GATEWAY_ACCOUNT_EXTERNAL_ID}/make-a-demo-payment`)
      cy.contains('a', 'Continue').click()
      cy.location('pathname').should('eq', `/account/${GATEWAY_ACCOUNT_EXTERNAL_ID}/make-a-demo-payment/mock-card-numbers`)
    })
  })
})
