const userStubs = require('@test/cypress/stubs/user-stubs')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const stripeAccountSetupStubs = require('@test/cypress/stubs/stripe-account-setup-stub')
const { checkTaskNavigation, checkDisplayedTasks, taskStatus } = require('./task-summary-test-helpers')
const { SANDBOX, STRIPE } = require('@models/payment-providers')
const stripePspStubs = require('@test/cypress/stubs/stripe-psp-stubs')

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service-456-def'
const SERVICE_NAME = {
  en: 'McDuck Enterprises', cy: 'Mentrau McDuck'
}
const LIVE_ACCOUNT_TYPE = 'live'
const GATEWAY_ACCOUNT_ID = 10
const STRIPE_ACCOUNT_ID = 'acct_123example123'

const SERVICE_SETTINGS_URL = `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings`

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
      role: opts.role,
      features: 'degatewayaccountification' // TODO remove features once simplified accounts are live
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE, {
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      type: LIVE_ACCOUNT_TYPE,
      payment_provider: opts.paymentProvider || STRIPE
    }),
    ...additionalStubs])
}

describe('Stripe details settings', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })
  describe('The task summary page', () => {
    describe('For an admin user', () => {
      beforeEach(() => {
        setStubs({}, [
          stripeAccountSetupStubs.getServiceAndAccountTypeStripeSetupSuccess({
            serviceExternalId: SERVICE_EXTERNAL_ID,
            accountType: LIVE_ACCOUNT_TYPE,
            bankAccount: true
          })
        ])
        cy.visit(SERVICE_SETTINGS_URL + '/stripe-details')
      })
      it('should show the correct title', () => {
        cy.title().should('eq', 'Settings - Stripe details - GOV.UK Pay')
      })
      it('should show the correct heading', () => {
        cy.get('h1').should('contain', 'Stripe details')
      })
      describe('The settings navigation', () => {
        it('should show stripe details', () => {
          cy.get('.service-settings-nav')
            .find('li')
            .contains('Stripe details')
            .then(li => {
              cy.wrap(li)
                .should('have.attr', 'href', `${SERVICE_SETTINGS_URL}/stripe-details`)
                .parent().should('have.class', 'service-settings-nav__li--active')
            })
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
              description: 'Viewtransactionslist'
            }
          ]
        }
        setStubs({
          role
        })
        cy.visit(SERVICE_SETTINGS_URL + '/stripe-details', { failOnStatusCode: false })
      })
      it('should show 404 page', () => {
        cy.title().should('eq', 'Page not found - GOV.UK Pay')
        cy.get('h1').should('contain.text', 'Page not found')
      })
    })
    describe('For non-stripe service', () => {
      beforeEach(() => {
        setStubs({
          paymentProvider: SANDBOX
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
        setStubs({}, [
          stripeAccountSetupStubs.getServiceAndAccountTypeStripeSetupSuccess({
            serviceExternalId: SERVICE_EXTERNAL_ID,
            accountType: LIVE_ACCOUNT_TYPE,
            bankAccount: true,
            responsiblePerson: true,
            director: true,
            vatNumber: true,
            companyNumber: true,
            organisationDetails: true,
            governmentEntityDocument: true
          }),
          gatewayAccountStubs.getStripeAccountByServiceIdAndAccountType(
            SERVICE_EXTERNAL_ID,
            LIVE_ACCOUNT_TYPE,
            {
              stripeAccountId: STRIPE_ACCOUNT_ID
            }
          ),
          stripePspStubs.retrieveAccountDetails({
            stripeAccountId: STRIPE_ACCOUNT_ID
          }),
          stripePspStubs.listPersons({
            stripeAccountId: STRIPE_ACCOUNT_ID,
            director: true,
            representative: true,
            firstName: 'Scrooge',
            lastName: 'McDuck'
          }),
          stripePspStubs.listBankAccount({
            stripeAccountId: STRIPE_ACCOUNT_ID,
            director: true,
            representative: true
          })
        ])
        cy.visit(SERVICE_SETTINGS_URL + '/stripe-details')
      })

      it('should show stripe details', () => {
        cy.get('.govuk-summary-card').should('have.length', 3)
        cy.get('.govuk-summary-card').eq(0)
          .should('contain', 'Sort code')
          .should('contain', '10-88-00')
        cy.get('.govuk-summary-card').eq(1)
          .should('contain', 'Service director')
          .should('contain', 'Scrooge McDuck')
        cy.get('.govuk-summary-card').eq(2)
          .should('contain', 'Company registration number')
          .should('contain', 'Provided')
      })
    })
    describe('When no tasks are complete', () => {
      beforeEach(() => {
        setStubs({}, [
          stripeAccountSetupStubs.getServiceAndAccountTypeStripeSetupSuccess({
            serviceExternalId: SERVICE_EXTERNAL_ID,
            accountType: LIVE_ACCOUNT_TYPE
          })
        ])
        cy.visit(SERVICE_SETTINGS_URL + '/stripe-details')
      })
      const expectedTasks = [
        {
          name: 'Organisation\'s bank details',
          heading: 'Organisation\'s bank details',
          status: taskStatus.NOT_STARTED,
          tagClass: 'govuk-tag govuk-tag--blue'
        },
        {
          name: 'Responsible person',
          heading: 'Responsible person',
          status: taskStatus.NOT_STARTED,
          tagClass: 'govuk-tag govuk-tag--blue'
        },
        {
          name: 'Service director',
          heading: 'Service director',
          status: taskStatus.NOT_STARTED,
          tagClass: 'govuk-tag govuk-tag--blue'
        },
        {
          name: 'VAT registration number',
          heading: 'VAT registration number',
          status: taskStatus.NOT_STARTED,
          tagClass: 'govuk-tag govuk-tag--blue'
        },
        {
          name: 'Company registration number',
          heading: 'Company registration number',
          status: taskStatus.NOT_STARTED,
          tagClass: 'govuk-tag govuk-tag--blue'
        },
        {
          name: 'Confirm your organisation\'s name and address match your government entity document',
          heading: 'Organisation details',
          status: taskStatus.NOT_STARTED,
          tagClass: 'govuk-tag govuk-tag--blue'
        },
        {
          name: 'Government entity document',
          heading: 'Government entity document',
          status: taskStatus.CANNOT_START,
          tagClass: 'govuk-tag govuk-tag--grey'
        }
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
          stripeAccountSetupStubs.getServiceAndAccountTypeStripeSetupSuccess({
            serviceExternalId: SERVICE_EXTERNAL_ID,
            accountType: LIVE_ACCOUNT_TYPE,
            bankAccount: true,
            responsiblePerson: true,
            director: true,
            vatNumber: true,
            companyNumber: true,
            organisationDetails: true
          })
        ])
        cy.visit(SERVICE_SETTINGS_URL + '/stripe-details')
      })
      const expectedTasks = [
        {
          name: 'Organisation\'s bank details',
          heading: 'Organisation\'s bank details',
          status: taskStatus.COMPLETE,
          tagClass: 'govuk-tag'
        },
        {
          name: 'Responsible person',
          heading: 'Responsible person',
          status: taskStatus.COMPLETE,
          tagClass: 'govuk-tag'
        },
        {
          name: 'Service director',
          heading: 'Service director',
          status: taskStatus.COMPLETE,
          tagClass: 'govuk-tag'
        },
        {
          name: 'VAT registration number',
          heading: 'VAT registration number',
          status: taskStatus.COMPLETE,
          tagClass: 'govuk-tag'
        },
        {
          name: 'Company registration number',
          heading: 'Company registration number',
          status: taskStatus.COMPLETE,
          tagClass: 'govuk-tag'
        },
        {
          name: 'Confirm your organisation\'s name and address match your government entity document',
          heading: 'Organisation details',
          status: taskStatus.COMPLETE,
          tagClass: 'govuk-tag'
        },
        {
          name: 'Government entity document',
          heading: 'Upload a government entity document',
          status: taskStatus.NOT_STARTED,
          tagClass: 'govuk-tag govuk-tag--blue'
        }
      ]

      it('should show \'Government entity document\' task as available and all other tasks as complete', () => {
        checkDisplayedTasks(7, expectedTasks)
      })
      it('should navigate to \'Government entity document\' task when clicked', () => {
        checkTaskNavigation(1, [expectedTasks[6]])
      })
    })
  })
})