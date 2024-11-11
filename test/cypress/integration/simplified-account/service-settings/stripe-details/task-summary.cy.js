const userStubs = require('../../../../stubs/user-stubs')
const gatewayAccountStubs = require('../../../../stubs/gateway-account-stubs')
const stripeAccountSetupStubs = require('../../../../stubs/stripe-account-setup-stub')
const { checkTaskNavigation, checkDisplayedTasks, taskStatus } = require('./task-summary-test-helpers')
const { SANDBOX, STRIPE } = require('../../../../../../app/models/payment-providers')

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service-456-def'
const SERVICE_NAME = {
  en: 'My Cool Service', cy: 'Fy Ngwasanaeth Cwl'
}
const LIVE_ACCOUNT_TYPE = 'live'
const GATEWAY_ACCOUNT_ID = 10

const SERVICE_SETTINGS_URL = `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings`

const setStubs = (opts = {}, additionalStubs = []) => {
  cy.task('setupStubs', [
    userStubs.getUserSuccess({
      userExternalId: USER_EXTERNAL_ID,
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      serviceName: SERVICE_NAME,
      serviceExternalId: SERVICE_EXTERNAL_ID,
      role: opts.role,
      features: 'degatewayaccountification' // TODO remove features once simplified accounts are live
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE, {
      gateway_account_id: GATEWAY_ACCOUNT_ID, type: LIVE_ACCOUNT_TYPE, payment_provider: opts.paymentProvider || STRIPE
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
          })
        ])
        cy.visit(SERVICE_SETTINGS_URL + '/stripe-details')
      })
      const expectedTasks = [
        {
          name: 'Organisation\'s bank details',
          status: taskStatus.COMPLETE,
          tagClass: 'govuk-tag'
        },
        {
          name: 'Responsible person',
          status: taskStatus.COMPLETE,
          tagClass: 'govuk-tag'
        },
        {
          name: 'Service director',
          status: taskStatus.COMPLETE,
          tagClass: 'govuk-tag'
        },
        {
          name: 'VAT registration number',
          status: taskStatus.COMPLETE,
          tagClass: 'govuk-tag'
        },
        {
          name: 'Company registration number',
          status: taskStatus.COMPLETE,
          tagClass: 'govuk-tag'
        },
        {
          name: 'Confirm your organisation\'s name and address match your government entity document',
          status: taskStatus.COMPLETE,
          tagClass: 'govuk-tag'
        },
        {
          name: 'Government entity document',
          status: taskStatus.COMPLETE,
          tagClass: 'govuk-tag'
        }
      ]

      it('should show all tasks as completed and non-interactable', () => {
        checkDisplayedTasks(7, expectedTasks)
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
          status: taskStatus.NOT_STARTED,
          tagClass: 'govuk-tag govuk-tag--blue'
        },
        {
          name: 'Responsible person',
          status: taskStatus.NOT_STARTED,
          tagClass: 'govuk-tag govuk-tag--blue'
        },
        {
          name: 'Service director',
          status: taskStatus.NOT_STARTED,
          tagClass: 'govuk-tag govuk-tag--blue'
        },
        {
          name: 'VAT registration number',
          status: taskStatus.NOT_STARTED,
          tagClass: 'govuk-tag govuk-tag--blue'
        },
        {
          name: 'Company registration number',
          status: taskStatus.NOT_STARTED,
          tagClass: 'govuk-tag govuk-tag--blue'
        },
        {
          name: 'Confirm your organisation\'s name and address match your government entity document',
          status: taskStatus.NOT_STARTED,
          tagClass: 'govuk-tag govuk-tag--blue'
        },
        {
          name: 'Government entity document',
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
          status: taskStatus.COMPLETE,
          tagClass: 'govuk-tag'
        },
        {
          name: 'Responsible person',
          status: taskStatus.COMPLETE,
          tagClass: 'govuk-tag'
        },
        {
          name: 'Service director',
          status: taskStatus.COMPLETE,
          tagClass: 'govuk-tag'
        },
        {
          name: 'VAT registration number',
          status: taskStatus.COMPLETE,
          tagClass: 'govuk-tag'
        },
        {
          name: 'Company registration number',
          status: taskStatus.COMPLETE,
          tagClass: 'govuk-tag'
        },
        {
          name: 'Confirm your organisation\'s name and address match your government entity document',
          status: taskStatus.COMPLETE,
          tagClass: 'govuk-tag'
        },
        {
          name: 'Government entity document',
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
