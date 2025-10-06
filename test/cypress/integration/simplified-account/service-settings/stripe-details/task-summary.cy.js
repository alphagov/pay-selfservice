const GoLiveStage = require('@models/constants/go-live-stage')
const checkSettingsNavigation = require('@test/cypress/integration/simplified-account/service-settings/helpers/check-settings-nav')
const userStubs = require('@test/cypress/stubs/user-stubs')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const stripeAccountSetupStubs = require('@test/cypress/stubs/stripe-account-setup-stub')
const { checkTaskNavigation, checkDisplayedTasks, taskStatus } = require('./task-summary-test-helpers')
const { SANDBOX, STRIPE } = require('@models/constants/payment-providers')
const stripePspStubs = require('@test/cypress/stubs/stripe-psp-stubs')
const {
  STRIPE_CREDENTIAL_IN_ACTIVE_STATE,
  STRIPE_CREDENTIAL_IN_CREATED_STATE,
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

const SERVICE_SETTINGS_URL = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings`

const setStubs = (opts = {}, additionalStubs = []) => {
  cy.task('setupStubs', [
    userStubs.getUserSuccess({
      userExternalId: USER_EXTERNAL_ID,
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      serviceName: SERVICE_NAME,
      serviceExternalId: SERVICE_EXTERNAL_ID,
      goLiveStage: GoLiveStage.LIVE,
      merchantDetails: {
        name: 'McDuck Enterprises',
        address_line1: 'McDuck Manor',
        address_city: 'Duckburg',
        address_postcode: 'SW1A 1AA',
      },
      role: opts.role,
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE, {
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      type: LIVE_ACCOUNT_TYPE,
      payment_provider: opts.paymentProvider || STRIPE,
      provider_switch_enabled: opts.providerSwitchEnabled || false,
      gateway_account_credentials: [opts.credential ?? STRIPE_CREDENTIAL_IN_CREATED_STATE],
    }),
    ...additionalStubs,
  ])
}

describe('Stripe details settings', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })
  describe('The task summary page', () => {
    describe('For an admin user', () => {
      beforeEach(() => {
        setStubs({}, [
          stripeAccountSetupStubs.getStripeSetupProgressByServiceExternalIdAndAccountType({
            serviceExternalId: SERVICE_EXTERNAL_ID,
            accountType: LIVE_ACCOUNT_TYPE,
            bankAccount: true,
          }),
        ])
        cy.visit(SERVICE_SETTINGS_URL + '/stripe-details')
      })
      it('should show the correct title', () => {
        cy.title().should('eq', 'Stripe details - Settings - McDuck Enterprises - GOV.UK Pay')
      })
      it('should show the correct heading', () => {
        cy.get('h1').should('contain', 'Stripe details')
      })
      it('should show stripe account ID', () => {
        cy.get('h2').should('contain', 'Stripe Account ID')
        cy.get('[data-cy="stripe-account-id"]').should(
          'contain',
          STRIPE_CREDENTIAL_IN_ACTIVE_STATE.credentials.stripe_account_id
        )
      })
      describe('The settings navigation', () => {
        it('should show active "Stripe details" link in the setting navigation', () => {
          checkSettingsNavigation('Stripe details', SERVICE_SETTINGS_URL + '/stripe-details')
        })
      })
    })
    describe('For any other user type', () => {
      beforeEach(() => {
        const role = {
          name: 'view-only',
          description: 'View only',
          permissions: [
            {
              name: 'transactions:read',
              description: 'Viewtransactionslist',
            },
          ],
        }
        setStubs(
          {
            role,
          },
          [
            stripeAccountSetupStubs.getStripeSetupProgressByServiceExternalIdAndAccountType({
              serviceExternalId: SERVICE_EXTERNAL_ID,
              accountType: LIVE_ACCOUNT_TYPE,
            }),
          ]
        )
        cy.visit(SERVICE_SETTINGS_URL + '/stripe-details', { failOnStatusCode: false })
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
    describe('For non-stripe service', () => {
      beforeEach(() => {
        setStubs({
          paymentProvider: SANDBOX,
        })
        cy.visit(SERVICE_SETTINGS_URL + '/stripe-details', { failOnStatusCode: false })
      })
      it('should show 404 page', () => {
        cy.title().should('eq', 'Page not found - GOV.UK Pay')
        cy.get('h1').should('contain.text', 'Page not found')
      })
    })
    describe('When all tasks are complete', () => {
      beforeEach(() => {
        setStubs(
          {
            credential: STRIPE_CREDENTIAL_IN_ACTIVE_STATE,
          },
          [
            stripeAccountSetupStubs.getStripeSetupProgressByServiceExternalIdAndAccountType({
              serviceExternalId: SERVICE_EXTERNAL_ID,
              accountType: LIVE_ACCOUNT_TYPE,
              bankAccount: true,
              responsiblePerson: true,
              director: true,
              vatNumber: true,
              companyNumber: true,
              organisationDetails: true,
              governmentEntityDocument: true,
            }),
            gatewayAccountStubs.getStripeAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE, {
              stripeAccountId: STRIPE_ACCOUNT_ID,
            }),
            stripePspStubs.retrieveAccountDetails({
              stripeAccountId: STRIPE_ACCOUNT_ID,
            }),
            stripePspStubs.listPersons({
              stripeAccountId: STRIPE_ACCOUNT_ID,
              director: true,
              representative: true,
              firstName: 'Scrooge',
              lastName: 'McDuck',
            }),
            stripePspStubs.listBankAccount({
              stripeAccountId: STRIPE_ACCOUNT_ID,
              director: true,
              representative: true,
            }),
          ]
        )
        cy.visit(SERVICE_SETTINGS_URL + '/stripe-details')
      })

      it('should show stripe details', () => {
        cy.get('[data-cy="stripe-account-id"]').should(
          'contain',
          STRIPE_CREDENTIAL_IN_ACTIVE_STATE.credentials.stripe_account_id
        )
        cy.get('.govuk-summary-card').should('have.length', 3)
        cy.get('.govuk-summary-card').eq(0).should('contain', 'Sort code').should('contain', '10-88-00')
        cy.get('.govuk-summary-card').eq(1).should('contain', 'Service director').should('contain', 'Scrooge McDuck')
        cy.get('.govuk-summary-card')
          .eq(2)
          .should('contain', 'Company registration number')
          .should('contain', 'Provided')
      })
    })
    describe('When no tasks are complete', () => {
      beforeEach(() => {
        setStubs({}, [
          stripeAccountSetupStubs.getStripeSetupProgressByServiceExternalIdAndAccountType({
            serviceExternalId: SERVICE_EXTERNAL_ID,
            accountType: LIVE_ACCOUNT_TYPE,
          }),
        ])
        cy.visit(SERVICE_SETTINGS_URL + '/stripe-details')
      })
      const expectedTasks = [
        {
          name: "Organisation's bank details",
          heading: "Organisation's bank details",
          status: taskStatus.NOT_STARTED,
          tagClass: 'govuk-tag govuk-tag--blue',
        },
        {
          name: 'Responsible person',
          heading: 'Responsible person',
          status: taskStatus.NOT_STARTED,
          tagClass: 'govuk-tag govuk-tag--blue',
        },
        {
          name: 'Service director',
          heading: 'Service director',
          status: taskStatus.NOT_STARTED,
          tagClass: 'govuk-tag govuk-tag--blue',
        },
        {
          name: 'VAT registration number',
          heading: 'VAT registration number',
          status: taskStatus.NOT_STARTED,
          tagClass: 'govuk-tag govuk-tag--blue',
        },
        {
          name: 'Company registration number',
          heading: 'Company registration number',
          status: taskStatus.NOT_STARTED,
          tagClass: 'govuk-tag govuk-tag--blue',
        },
        {
          name: "Confirm your organisation's name and address match your government entity document",
          heading: 'Organisation details',
          status: taskStatus.NOT_STARTED,
          tagClass: 'govuk-tag govuk-tag--blue',
        },
        {
          name: 'Government entity document',
          heading: 'Government entity document',
          status: taskStatus.CANNOT_START,
          tagClass: 'govuk-tag govuk-tag--grey',
        },
      ]

      it('should show all tasks in default state', () => {
        checkDisplayedTasks(7, expectedTasks)
      })
      it('should navigate to each available task when clicked', () => {
        checkTaskNavigation(6, expectedTasks)
      })
    })
    describe('When all tasks except Government Entity Document are complete', () => {
      beforeEach(() => {
        setStubs({}, [
          stripeAccountSetupStubs.getStripeSetupProgressByServiceExternalIdAndAccountType({
            serviceExternalId: SERVICE_EXTERNAL_ID,
            accountType: LIVE_ACCOUNT_TYPE,
            bankAccount: true,
            responsiblePerson: true,
            director: true,
            vatNumber: true,
            companyNumber: true,
            organisationDetails: true,
          }),
        ])
        cy.visit(SERVICE_SETTINGS_URL + '/stripe-details')
      })
      const expectedTasks = [
        {
          name: "Organisation's bank details",
          heading: "Organisation's bank details",
          status: taskStatus.COMPLETE,
          tagClass: 'govuk-tag',
        },
        {
          name: 'Responsible person',
          heading: 'Responsible person',
          status: taskStatus.COMPLETE,
          tagClass: 'govuk-tag',
        },
        {
          name: 'Service director',
          heading: 'Service director',
          status: taskStatus.COMPLETE,
          tagClass: 'govuk-tag',
        },
        {
          name: 'VAT registration number',
          heading: 'VAT registration number',
          status: taskStatus.COMPLETE,
          tagClass: 'govuk-tag',
        },
        {
          name: 'Company registration number',
          heading: 'Company registration number',
          status: taskStatus.COMPLETE,
          tagClass: 'govuk-tag',
        },
        {
          name: "Confirm your organisation's name and address match your government entity document",
          heading: 'Organisation details',
          status: taskStatus.COMPLETE,
          tagClass: 'govuk-tag',
        },
        {
          name: 'Government entity document',
          heading: 'Upload a government entity document',
          status: taskStatus.NOT_STARTED,
          tagClass: 'govuk-tag govuk-tag--blue',
        },
      ]

      it("should show 'Government entity document' task as available and all other tasks as complete", () => {
        checkDisplayedTasks(7, expectedTasks)
      })
      it("should navigate to 'Government entity document' task when clicked", () => {
        checkTaskNavigation(1, [expectedTasks[6]])
      })
    })
    describe('When account is switching provider', () => {
      beforeEach(() => {
        setStubs(
          {
            credential: STRIPE_CREDENTIAL_IN_ACTIVE_STATE,
            providerSwitchEnabled: true,
          },
          [
            stripeAccountSetupStubs.getStripeSetupProgressByServiceExternalIdAndAccountType({
              serviceExternalId: SERVICE_EXTERNAL_ID,
              accountType: LIVE_ACCOUNT_TYPE,
              bankAccount: true,
              responsiblePerson: true,
              director: true,
              vatNumber: true,
              companyNumber: true,
              organisationDetails: true,
              governmentEntityDocument: true,
            }),
            gatewayAccountStubs.getStripeAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE, {
              stripeAccountId: STRIPE_ACCOUNT_ID,
            }),
            stripePspStubs.retrieveAccountDetails({
              stripeAccountId: STRIPE_ACCOUNT_ID,
            }),
            stripePspStubs.listPersons({
              stripeAccountId: STRIPE_ACCOUNT_ID,
              director: true,
              representative: true,
              firstName: 'Scrooge',
              lastName: 'McDuck',
            }),
            stripePspStubs.listBankAccount({
              stripeAccountId: STRIPE_ACCOUNT_ID,
              director: true,
              representative: true,
            }),
          ]
        )
        cy.visit(SERVICE_SETTINGS_URL + '/stripe-details')
      })

      it('should show information about switching', () => {
        cy.get('.govuk-inset-text').should(
          'contain.text',
          'Your service is ready to switch PSP from Stripe to Worldpay'
        )
      })
    })

    describe('When account is pending kyc check confirmation', () => {
      beforeEach(() => {
        setStubs({}, [
          stripeAccountSetupStubs.getStripeSetupProgressByServiceExternalIdAndAccountType({
            serviceExternalId: SERVICE_EXTERNAL_ID,
            accountType: LIVE_ACCOUNT_TYPE,
            bankAccount: true,
            responsiblePerson: true,
            director: true,
            vatNumber: true,
            companyNumber: true,
            organisationDetails: true,
            governmentEntityDocument: true,
          }),
          gatewayAccountStubs.getStripeAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE, {
            stripeAccountId: STRIPE_ACCOUNT_ID,
          }),
          stripePspStubs.retrieveAccountDetails({
            stripeAccountId: STRIPE_ACCOUNT_ID,
          }),
          stripePspStubs.listPersons({
            stripeAccountId: STRIPE_ACCOUNT_ID,
            director: true,
            representative: true,
            firstName: 'Scrooge',
            lastName: 'McDuck',
          }),
          stripePspStubs.listBankAccount({
            stripeAccountId: STRIPE_ACCOUNT_ID,
            director: true,
            representative: true,
          }),
        ])
        cy.visit(SERVICE_SETTINGS_URL + '/stripe-details')
      })

      it('should show information about pending checks', () => {
        cy.get('.system-messages')
          .should('contain.text', 'Stripe is still checking your information')
          .should('contain.text', 'We will contact you if there is a problem')
        cy.get('#service-name').find('.govuk-tag').should('contain.text', 'Not live yet')
      })
    })
  })
})
