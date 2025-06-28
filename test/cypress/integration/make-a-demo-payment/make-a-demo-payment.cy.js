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
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, options.type || 'test', {
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      external_id: GATEWAY_ACCOUNT_EXTERNAL_ID,
      payment_provider: options.paymentProvider || 'sandbox',
      type: options.type || 'test'
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

      it('should check accessibility of the page', { defaultCommandTimeout: 15000 }, () => {
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/dashboard`)
        cy.a11yCheck()
      })

      it('should be possible to access the "make a test payment" page', () => {
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/dashboard`)
        cy.contains('a', 'Make a test payment').should('exist').click()
        cy.location('pathname').should('eq', `/service/${SERVICE_EXTERNAL_ID}/account/test/demo-payment`)
      })
    })

    describe('for an admin user', () => {
      beforeEach(() => {
        setupStubs({
          role: 'admin',
        })
      })

      it('should check accessibility of the page', { defaultCommandTimeout: 15000 }, () => {
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/dashboard`)
        cy.a11yCheck()
      })

      it('should be possible to access the "make a test payment" page', () => {
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/dashboard`)
        cy.contains('a', 'Make a test payment').should('exist').click()
        cy.location('pathname').should('eq', `/service/${SERVICE_EXTERNAL_ID}/account/test/demo-payment`)
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

      it('should be possible to access the "make a test payment" page', () => {
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/dashboard`)
        cy.contains('a', 'Make a test payment').should('exist').click()
        cy.location('pathname').should('eq', `/service/${SERVICE_EXTERNAL_ID}/account/test/demo-payment`)
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

      it('should be possible to access the "make a test payment" page', () => {
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/dashboard`)
        cy.contains('a', 'Make a test payment').should('exist').click()
        cy.location('pathname').should('eq', `/service/${SERVICE_EXTERNAL_ID}/account/test/demo-payment`)
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

      it('should not be possible to access the "make a test payment" page', () => {
        cy.request({
          url: `/service/${SERVICE_EXTERNAL_ID}/account/live/demo-payment`,
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

      it('should not be possible to access the "make a test payment" page', () => {
        cy.request({
          url: `/service/${SERVICE_EXTERNAL_ID}/account/test/demo-payment`,
          failOnStatusCode: false,
        }).then((response) => expect(response.status).to.eq(404))
      })
    })
  })

  describe('edit payment description', () => {
    beforeEach(() => {
      setupStubs()
    })

    it('should allow navigate to the "update payment details" page', () => {
      cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/demo-payment`)

      cy.get('.govuk-summary-card').find('a').contains('Change').click()
      cy.location('pathname').should('eq', `/service/${SERVICE_EXTERNAL_ID}/account/test/demo-payment/edit`)
      cy.get('a.govuk-back-link').should('have.attr', 'href', `/service/${SERVICE_EXTERNAL_ID}/account/test/demo-payment`)
      cy.get('h1').should('contain.text', 'Update details for test payment')
      cy.get('label').eq(0)
        .should('contain.text', 'Payment description')
      cy.get('label').eq(1)
        .should('contain.text', 'Payment amount')
      cy.get('input[name=paymentDescription]').should('have.value', 'An example payment description')
      cy.get('input[name=paymentAmount]').should('have.value', '20.00')
    })

    it('should show an error when submitting empty inputs', () => {
      cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/demo-payment`)
      cy.get('.govuk-summary-card').find('a').contains('Change').click()

      cy.get('input[name=paymentDescription]').clear({force: true})
      cy.get('input[name=paymentAmount]').clear({force: true})
      cy.get('button').contains('Save changes').click()
      cy.get('.govuk-error-summary').should('exist').within(() => {
        cy.get('h2').should('contain', 'There is a problem')
        cy.get('.govuk-error-summary__list').get('li').should('have.length', 2)
          .contains('Enter a payment description')
          .should('have.attr', 'href', '#payment-description')
          .parent()
          .parent()
          .contains('Enter a payment amount')
          .should('have.attr', 'href', '#payment-amount')
      })
      cy.get('input[name=paymentDescription]').should('have.value', '')
      cy.get('input[name=paymentAmount]').should('have.value', '')
    })

    it('should update the payment details when submitting a valid description', () => {
      cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/demo-payment`)
      cy.get('.govuk-summary-card').find('a').contains('Change').click()

      cy.get('input[name=paymentDescription]').clear({force: true})
        .type('New description', { delay: 0 })

      cy.get('input[name=paymentAmount]').clear({force: true})
        .type('1337', { delay: 0 })

      cy.get('button').contains('Save changes').click()
      cy.get('h1').should('contain.text', 'Make a test payment')
      cy.get('dt.govuk-summary-list__key').contains('Payment description')
        .parent()
        .contains('New description')
      cy.get('dt.govuk-summary-list__key').contains('Payment amount')
        .parent()
        .contains('£1,337.00')
    })
  })

  describe('on form submission', () => {
    beforeEach(() => {
      setupStubs()
    })

    it('should navigate to the "mock card numbers" page', () => {
      cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/demo-payment`)
      cy.contains('a', 'Continue').click()
      cy.location('pathname').should('eq', `/service/${SERVICE_EXTERNAL_ID}/account/test/demo-payment/mock-card-number`)
    })
  })
})
