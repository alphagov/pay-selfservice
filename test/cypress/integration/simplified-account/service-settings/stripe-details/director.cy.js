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
  describe('The director task', () => {
    describe('For a non-admin', () => {
      beforeEach(() => {
        setStubs({
          role: 'view-and-refund'
        })
        cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/director', { failOnStatusCode: false })
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
        cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/director', { failOnStatusCode: false })
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
            director: true
          })
        ])
        cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/director')
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
        cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/director')
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
          cy.title().should('eq', 'Service director - Settings - McDuck Enterprises - GOV.UK Pay')
        })
        it('should show the correct heading', () => {
          cy.get('h1').should('contain', 'Service director')
        })
      })
      describe('When inputting director details', () => {
        beforeEach(() => {
          setStubs({}, [
            stripeAccountSetupStubs.getStripeSetupProgressByServiceExternalIdAndAccountType({
              serviceExternalId: SERVICE_EXTERNAL_ID,
              accountType: LIVE_ACCOUNT_TYPE
            })
          ])
          cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/director')
        })

        it('should render errors when submitting bad inputs', () => {
          const emptyFirstNameError = 'Enter the first name'
          const emptyLastNameError = 'Enter the last name'
          const tooOldError = 'Enter a valid year of birth'
          const invalidEmailError = 'Enter a real email address'

          cy.get('.govuk-error-summary').should('not.exist')

          cy.get('input[name="firstName"]')
            .clear({ force: true })
          cy.get('input[name="lastName"]')
            .clear({ force: true })
          cy.get('input[name="dobDay"]')
            .clear({ force: true })
            .type('01')
          cy.get('input[name="dobMonth"]')
            .clear({ force: true })
            .type('01')
          cy.get('input[name="dobYear"]')
            .clear({ force: true })
            .type('1899')
          cy.get('input[name="workEmail"]')
            .clear({ force: true })
            .type('not.an.email.address')

          cy.get('#director-submit').click()
          cy.get('.govuk-error-summary')
            .should('exist')
            .should('contain', emptyFirstNameError)
            .should('contain', emptyLastNameError)
            .should('contain', tooOldError)
            .should('contain', invalidEmailError)
          cy.get('input[name="firstName"]').should('have.class', 'govuk-input--error')
          cy.get('#first-name-error').should('contain.text', emptyFirstNameError)
          cy.get('input[name="lastName"]').should('have.class', 'govuk-input--error')
          cy.get('#last-name-error').should('contain.text', emptyLastNameError)
          cy.get('#dob-error').should('contain.text', tooOldError)
          cy.get('input[name="workEmail"]').should('have.class', 'govuk-input--error')
          cy.get('#work-email-error').should('contain.text', invalidEmailError)
        })
      })
      describe('When submitting valid director details', () => {
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
            stripePspStubs.listPersons({
              stripeAccountId: STRIPE_ACCOUNT_ID
            }),
            stripePspStubs.createPerson({
              stripeAccountId: STRIPE_ACCOUNT_ID,
              director: true
            }),
            stripePspStubs.updateAccount({
              stripeAccountId: STRIPE_ACCOUNT_ID
            }),
            stripeAccountSetupStubs.patchStripeProgressByServiceExternalIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE,
              {
                path: 'director',
                value: true
              }),
            stripeAccountSetupStubs.getStripeSetupProgressByServiceExternalIdAndAccountType({
              serviceExternalId: SERVICE_EXTERNAL_ID,
              accountType: LIVE_ACCOUNT_TYPE,
              director: true
            })
          ])
          cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/director')
        })

        it('should redirect to the task summary page on success', () => {
          cy.get('input[name="firstName"]')
            .clear({ force: true })
            .type('Scrooge')
          cy.get('input[name="lastName"]')
            .clear({ force: true })
            .type('McDuck')
          cy.get('input[name="dobDay"]')
            .clear({ force: true })
            .type('01')
          cy.get('input[name="dobMonth"]')
            .clear({ force: true })
            .type('01')
          cy.get('input[name="dobYear"]')
            .clear({ force: true })
            .type('1901')
          cy.get('input[name="workEmail"]')
            .clear({ force: true })
            .type('atotallyrealemailaddress@example.com')

          cy.get('#director-submit').click()
          cy.title().should('eq', 'Stripe details - Settings - McDuck Enterprises - GOV.UK Pay')
          cy.get('h1').should('contain', 'Stripe details')
          cy.location('pathname').should('not.contain', '/vat-number')
          cy.get('.govuk-task-list__item')
            .contains('Service director')
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
