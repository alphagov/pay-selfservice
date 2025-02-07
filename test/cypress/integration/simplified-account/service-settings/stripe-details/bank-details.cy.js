const userStubs = require('@test/cypress/stubs/user-stubs')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const stripeAccountSetupStubs = require('@test/cypress/stubs/stripe-account-setup-stub')
const { STRIPE, WORLDPAY } = require('@models/constants/payment-providers')
const stripePspStubs = require('@test/cypress/stubs/stripe-psp-stubs')
const ROLES = require('@test/fixtures/roles.fixtures')

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service-456-def'
const SERVICE_NAME = {
  en: 'McDuck Enterprises', cy: 'Mentrau McDuck'
}
const LIVE_ACCOUNT_TYPE = 'live'
const GATEWAY_ACCOUNT_ID = 10
const STRIPE_ACCOUNT_ID = 'acct_123example123'

const STRIPE_DETAILS_SETTINGS_URL = `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/stripe-details`

const setStubs = (opts = {}, additionalStubs = []) => {
  cy.task('setupStubs', [
    userStubs.getUserSuccess({
      userExternalId: USER_EXTERNAL_ID,
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      serviceName: SERVICE_NAME,
      serviceExternalId: SERVICE_EXTERNAL_ID,
      merchantDetails: {
        name: 'McDuck Enterprises',
        address_line1: 'McDuck Manor',
        address_city: 'Duckburg',
        address_postcode: 'SW1A 1AA'
      },
      role: ROLES[opts.role || 'admin'],
      features: 'degatewayaccountification' // TODO remove features once simplified accounts are live
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE, {
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      type: LIVE_ACCOUNT_TYPE,
      payment_provider: opts.paymentProvider || STRIPE,
      provider_switch_enabled: opts.providerSwitchEnabled || false
    }),
    ...additionalStubs])
}

describe('Stripe details settings', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })
  describe('The bank details task', () => {
    describe('For a non-admin', () => {
      beforeEach(() => {
        setStubs({
          role: 'view-and-refund'
        })
        cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/bank-details', { failOnStatusCode: false })
      })
      it('should show admin only error', () => {
        cy.title().should('eq', 'An error occurred - GOV.UK Pay')
        cy.get('h1').should('contain.text', 'An error occurred')
        cy.get('#errorMsg').should('contain.text', 'You do not have the administrator rights to perform this operation.')
      })
    })
    describe('For a non-stripe service', () => {
      beforeEach(() => {
        setStubs({
          paymentProvider: WORLDPAY
        })
        cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/bank-details', { failOnStatusCode: false })
      })
      it('should show not found page', () => {
        cy.title().should('eq', 'Page not found - GOV.UK Pay')
        cy.get('h1').should('contain.text', 'Page not found')
      })
    })
    describe('Completed', () => {
      beforeEach(() => {
        setStubs({}, [
          stripeAccountSetupStubs.getStripeSetupProgressByServiceExternalIdAndAccountType({
            serviceExternalId: SERVICE_EXTERNAL_ID,
            accountType: LIVE_ACCOUNT_TYPE,
            bankAccount: true
          })
        ])
        cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/bank-details')
      })
      it('should show the task already completed page', () => {
        cy.title().should('eq', 'An error occurred - GOV.UK Pay')
        cy.get('h1').should('contain', 'You\'ve already completed this task')
      })
    })
    describe('Not yet started', () => {
      beforeEach(() => {
        setStubs({}, [
          stripeAccountSetupStubs.getStripeSetupProgressByServiceExternalIdAndAccountType({
            serviceExternalId: SERVICE_EXTERNAL_ID,
            accountType: LIVE_ACCOUNT_TYPE
          })
        ])
        cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/bank-details')
      })
      describe('The settings navigation', () => {
        it('should show stripe details', () => {
          cy.get('.service-settings-nav')
            .find('li')
            .contains('Stripe details')
            .then(li => {
              cy.wrap(li)
                .should('have.attr', 'href', STRIPE_DETAILS_SETTINGS_URL)
                .parent().should('have.class', 'service-settings-nav__li--active')
            })
        })
      })
      describe('The task page', () => {
        it('should show the correct title', () => {
          cy.title().should('eq', 'Organisation’s bank details - Settings - McDuck Enterprises - GOV.UK Pay')
        })
        it('should show the correct heading', () => {
          cy.get('h1').should('contain', 'Organisation\'s bank details')
        })
      })
      describe('When inputting bank details', () => {
        beforeEach(() => {
          setStubs({}, [
            stripeAccountSetupStubs.getStripeSetupProgressByServiceExternalIdAndAccountType({
              serviceExternalId: SERVICE_EXTERNAL_ID,
              accountType: LIVE_ACCOUNT_TYPE
            })
          ])
          cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/bank-details')
        })

        it('should format sort code with dashes when javascript is enabled', () => {
          cy.get('input[name="sortCode"]')
            .clear({ force: true })
            .type('010203')

          cy.get('input[name="sortCode"]').should('have.value', '01-02-03')
        })

        it('should disallow non-numeric characters on form inputs when javascript is enabled', () => {
          cy.get('input[name="sortCode"]')
            .clear({ force: true })
            .type('0102AB')

          cy.get('input[name="accountNumber"]')
            .clear({ force: true })
            .type('fff12345')

          cy.get('input[name="sortCode"]').should('have.value', '01-02')
          cy.get('input[name="accountNumber"]').should('have.value', '12345')
        })

        it('should render errors when submitting bad inputs', () => {
          const invalidSortCodeError = 'Enter a valid sort code like 30-94-30 or 309430'
          const emptySortCodeError = 'Enter a sort code'
          const invalidAccountNumberError = 'Enter a valid account number like 00733445'
          const emptyAccountNumberError = 'Enter an account number'

          cy.get('.govuk-error-summary').should('not.exist')

          cy.get('input[name="sortCode"]')
            .clear({ force: true })
            .type('00')
          cy.get('input[name="accountNumber"]')
            .clear({ force: true })
            .type('00')

          cy.get('#bank-account-submit').click()
          cy.get('.govuk-error-summary')
            .should('exist')
            .should('contain', invalidSortCodeError)
            .should('contain', invalidAccountNumberError)
          cy.get('input[name="sortCode"]').should('have.class', 'govuk-input--error')
          cy.get('input[name="accountNumber"]').should('have.class', 'govuk-input--error')
          cy.get('#sort-code-error').should('contain.text', invalidSortCodeError)
          cy.get('#account-number-error').should('contain.text', invalidAccountNumberError)

          cy.get('input[name="sortCode"]')
            .clear({ force: true })
          cy.get('input[name="accountNumber"]')
            .clear({ force: true })

          cy.get('#bank-account-submit').click()
          cy.get('.govuk-error-summary')
            .should('exist')
            .should('contain', emptySortCodeError)
            .should('contain', emptyAccountNumberError)
          cy.get('input[name="sortCode"]').should('have.class', 'govuk-input--error')
          cy.get('input[name="accountNumber"]').should('have.class', 'govuk-input--error')
          cy.get('#sort-code-error').should('contain.text', emptySortCodeError)
          cy.get('#account-number-error').should('contain.text', emptyAccountNumberError)
        })
      })
      describe('When submitting valid bank details', () => {
        beforeEach(() => {
          setStubs({}, [
            stripeAccountSetupStubs.getStripeSetupProgressByServiceExternalIdAndAccountType({
              serviceExternalId: SERVICE_EXTERNAL_ID,
              accountType: LIVE_ACCOUNT_TYPE
            }),
            gatewayAccountStubs.getStripeAccountByServiceIdAndAccountType(
              SERVICE_EXTERNAL_ID,
              LIVE_ACCOUNT_TYPE,
              {
                stripeAccountId: STRIPE_ACCOUNT_ID
              }
            ),
            stripePspStubs.updateAccount({
              stripeAccountId: STRIPE_ACCOUNT_ID
            }),
            stripeAccountSetupStubs.patchStripeProgressByServiceExternalIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE,
              {
                path: 'bank_account',
                value: true
              }),
            stripeAccountSetupStubs.getStripeSetupProgressByServiceExternalIdAndAccountType({
              serviceExternalId: SERVICE_EXTERNAL_ID,
              accountType: LIVE_ACCOUNT_TYPE,
              bankAccount: true
            })
          ])
          cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/bank-details')
        })

        it('should redirect to the task summary page on success', () => {
          cy.get('input[name="sortCode"]')
            .clear({ force: true })
            .type('010203')

          cy.get('input[name="accountNumber"]')
            .clear({ force: true })
            .type('00012345')

          cy.get('#bank-account-submit').click()
          cy.title().should('eq', 'Stripe details - Settings - McDuck Enterprises - GOV.UK Pay')
          cy.get('h1').should('contain', 'Stripe details')
          cy.location('pathname').should('not.contain', '/bank-details')
          cy.get('.govuk-task-list__item')
            .contains('Organisation\'s bank details')
            .parent()
            .parent()
            .within(() => {
              cy.get('.govuk-task-list__status').should('contain.text', 'Complete')
            })
        })
      })
    })
  })
})
