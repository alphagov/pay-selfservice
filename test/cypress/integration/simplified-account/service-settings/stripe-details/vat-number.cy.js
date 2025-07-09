const checkSettingsNavigation = require('@test/cypress/integration/simplified-account/service-settings/helpers/check-settings-nav')
const userStubs = require('@test/cypress/stubs/user-stubs')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const stripeAccountSetupStubs = require('@test/cypress/stubs/stripe-account-setup-stub')
const { STRIPE, WORLDPAY } = require('@models/constants/payment-providers')
const stripePspStubs = require('@test/cypress/stubs/stripe-psp-stubs')
const ROLES = require('@test/fixtures/roles.fixtures')
const {
  STRIPE_CREDENTIAL_IN_ACTIVE_STATE,
} = require('@test/fixtures/credentials.fixtures')

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const SERVICE_NAME = {
  en: 'McDuck Enterprises',
  cy: 'Mentrau McDuck',
}
const LIVE_ACCOUNT_TYPE = 'live'
const GATEWAY_ACCOUNT_ID = 10
const STRIPE_ACCOUNT_ID = STRIPE_CREDENTIAL_IN_ACTIVE_STATE.credentials.stripe_account_id

const STRIPE_DETAILS_SETTINGS_URL = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/stripe-details`

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
        address_postcode: 'SW1A 1AA',
      },
      role: ROLES[opts.role || 'admin'],
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE, {
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      type: LIVE_ACCOUNT_TYPE,
      payment_provider: opts.paymentProvider || STRIPE,
      provider_switch_enabled: opts.providerSwitchEnabled || false,
      gateway_account_credentials: [STRIPE_CREDENTIAL_IN_ACTIVE_STATE],
    }),
    ...additionalStubs,
  ])
}

describe('Stripe details settings', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })
  describe('The VAT number task', () => {
    describe('For a non-admin', () => {
      beforeEach(() => {
        setStubs({
          role: 'view-and-refund',
        })
        cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/vat-number', { failOnStatusCode: false })
      })
      it('should show admin only error', () => {
        cy.title().should('eq', 'An error occurred - GOV.UK Pay')
        cy.get('h1').should('contain.text', 'An error occurred')
        cy.get('#errorMsg').should(
          'contain.text',
          'You do not have the administrator rights to perform this operation.'
        )
      })
    })
    describe('For a non-stripe service', () => {
      beforeEach(() => {
        setStubs({
          paymentProvider: WORLDPAY,
        })
        cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/vat-number', { failOnStatusCode: false })
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
            vatNumber: true,
          }),
        ])
        cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/vat-number')
      })
      it('should show the task already completed page', () => {
        cy.title().should('eq', 'An error occurred - GOV.UK Pay')
        cy.get('h1').should('contain', "You've already completed this task")
      })
    })
    describe('Not yet started', () => {
      beforeEach(() => {
        setStubs({}, [
          stripeAccountSetupStubs.getStripeSetupProgressByServiceExternalIdAndAccountType({
            serviceExternalId: SERVICE_EXTERNAL_ID,
            accountType: LIVE_ACCOUNT_TYPE,
          }),
        ])
        cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/vat-number')
      })

      describe('The settings navigation', () => {
        it('should show active "Stripe details" link in the setting navigation', () => {
          checkSettingsNavigation('Stripe details', STRIPE_DETAILS_SETTINGS_URL)
        })
      })
      describe('The task page', () => {
        it('should show the correct title', () => {
          cy.title().should('eq', 'VAT registration number - Settings - McDuck Enterprises - GOV.UK Pay')
        })
        it('should show the correct heading', () => {
          cy.get('h1').should('contain', 'VAT registration number')
        })
      })
      describe('When inputting a VAT registration number', () => {
        beforeEach(() => {
          setStubs({}, [
            stripeAccountSetupStubs.getStripeSetupProgressByServiceExternalIdAndAccountType({
              serviceExternalId: SERVICE_EXTERNAL_ID,
              accountType: LIVE_ACCOUNT_TYPE,
            }),
          ])
          cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/vat-number')
        })

        it('should render errors when submitting bad inputs', () => {
          const invalidVATRegError = 'Enter a valid VAT registration number'
          const emptyVATRegError = 'Enter a VAT registration number'

          cy.get('.govuk-error-summary').should('not.exist')

          cy.get('input[type="radio"]').siblings('label').contains('Yes').prev('input[type="radio"]').check()

          cy.get('input[name="vatNumber"]').clear({ force: true }).type('what')

          cy.get('#vat-number-submit').click()
          cy.get('.govuk-error-summary').should('exist').should('contain', invalidVATRegError)
          cy.get('input[name="vatNumber"]').should('have.class', 'govuk-input--error')
          cy.get('#vat-number-error').should('contain.text', invalidVATRegError)

          cy.get('input[name="vatNumber"]').clear({ force: true })

          cy.get('#vat-number-submit').click()
          cy.get('.govuk-error-summary').should('exist').should('contain', emptyVATRegError)
          cy.get('input[name="vatNumber"]').should('have.class', 'govuk-input--error')
          cy.get('#vat-number-error').should('contain.text', emptyVATRegError)
        })
      })
      describe('When selecting yes and submitting a VAT number', () => {
        beforeEach(() => {
          setStubs({}, [
            stripeAccountSetupStubs.getStripeSetupProgressByServiceExternalIdAndAccountType({
              serviceExternalId: SERVICE_EXTERNAL_ID,
              accountType: LIVE_ACCOUNT_TYPE,
            }),
            gatewayAccountStubs.getStripeAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE, {
              stripeAccountId: STRIPE_ACCOUNT_ID,
            }),
            stripePspStubs.updateAccount({
              stripeAccountId: STRIPE_ACCOUNT_ID,
            }),
            stripeAccountSetupStubs.patchStripeProgressByServiceExternalIdAndAccountType(
              SERVICE_EXTERNAL_ID,
              LIVE_ACCOUNT_TYPE,
              {
                path: 'vat_number',
                value: true,
              }
            ),
            stripeAccountSetupStubs.getStripeSetupProgressByServiceExternalIdAndAccountType({
              serviceExternalId: SERVICE_EXTERNAL_ID,
              accountType: LIVE_ACCOUNT_TYPE,
              vatNumber: true,
            }),
          ])
          cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/vat-number')
        })

        it('should redirect to the task summary page on success', () => {
          cy.get('input[type="radio"]').siblings('label').contains('Yes').prev('input[type="radio"]').check()

          cy.get('input[name="vatNumber"]').clear({ force: true }).type('GB123456789')

          cy.get('#vat-number-submit').click()
          cy.title().should('eq', 'Stripe details - Settings - McDuck Enterprises - GOV.UK Pay')
          cy.get('h1').should('contain', 'Stripe details')
          cy.location('pathname').should('not.contain', '/vat-number')
          cy.get('.govuk-task-list__item')
            .contains('VAT registration number')
            .parent()
            .parent()
            .within(() => {
              cy.get('.govuk-task-list__status').should('contain.text', 'Complete')
            })
        })
      })
      describe('When selecting no and completing the task', () => {
        beforeEach(() => {
          setStubs({}, [
            stripeAccountSetupStubs.getStripeSetupProgressByServiceExternalIdAndAccountType({
              serviceExternalId: SERVICE_EXTERNAL_ID,
              accountType: LIVE_ACCOUNT_TYPE,
            }),
            gatewayAccountStubs.getStripeAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE, {
              stripeAccountId: STRIPE_ACCOUNT_ID,
            }),
            stripeAccountSetupStubs.patchStripeProgressByServiceExternalIdAndAccountType(
              SERVICE_EXTERNAL_ID,
              LIVE_ACCOUNT_TYPE,
              {
                path: 'vat_number',
                value: true,
              }
            ),
            stripeAccountSetupStubs.getStripeSetupProgressByServiceExternalIdAndAccountType({
              serviceExternalId: SERVICE_EXTERNAL_ID,
              accountType: LIVE_ACCOUNT_TYPE,
              vatNumber: true,
            }),
          ])
          cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/vat-number')
        })

        it('should redirect to the task summary page on success', () => {
          cy.get('input[type="radio"]').siblings('label').contains('No').prev('input[type="radio"]').check()

          cy.get('input[name="vatNumber"]').should('not.be.visible')

          cy.get('#vat-number-submit').click()
          cy.title().should('eq', 'Stripe details - Settings - McDuck Enterprises - GOV.UK Pay')
          cy.get('h1').should('contain', 'Stripe details')
          cy.location('pathname').should('not.contain', '/vat-number')
          cy.get('.govuk-task-list__item')
            .contains('VAT registration number')
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
