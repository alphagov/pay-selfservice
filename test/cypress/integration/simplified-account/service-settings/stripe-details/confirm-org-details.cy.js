const userStubs = require('@test/cypress/stubs/user-stubs')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const stripeAccountSetupStubs = require('@test/cypress/stubs/stripe-account-setup-stub')
const stripePspStubs = require('@test/cypress/stubs/stripe-psp-stubs')
const serviceStubs = require('@test/cypress/stubs/service-stubs')
const { STRIPE, WORLDPAY } = require('@models/payment-providers')
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
  describe('The confirm organisation details task', () => {
    describe('For a non-admin', () => {
      beforeEach(() => {
        setStubs({
          role: 'view-and-refund'
        })
        cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/organisation-details/index', { failOnStatusCode: false })
      })
      it('should show not found page', () => {
        cy.title().should('eq', 'Page not found - GOV.UK Pay')
        cy.get('h1').should('contain.text', 'Page not found')
      })
    })
    describe('For a non-stripe service', () => {
      beforeEach(() => {
        setStubs({
          paymentProvider: WORLDPAY
        })
        cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/organisation-details/index', { failOnStatusCode: false })
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
            organisationDetails: true
          })
        ])
        cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/organisation-details/index')
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
        cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/organisation-details/index')
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
          cy.title().should('eq', 'Settings - Stripe details - Organisation details - GOV.UK Pay')
        })
        it('should show the correct heading', () => {
          cy.get('h1').should('contain', 'Organisation details')
        })
      })
      describe('When selecting yes', () => {
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
                path: 'organisation_details',
                value: true
              }),
            stripeAccountSetupStubs.getStripeSetupProgressByServiceExternalIdAndAccountType({
              serviceExternalId: SERVICE_EXTERNAL_ID,
              accountType: LIVE_ACCOUNT_TYPE,
              organisationDetails: true
            })
          ])
          cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/organisation-details/index')
        })

        it('should redirect to the task summary page on success', () => {
          cy.get('.govuk-summary-list__row').should('have.length', 2)

          cy.get('.govuk-summary-list__row')
            .first()
            .should('contain.text', 'McDuck Enterprises')

          cy.get('.govuk-summary-list__row')
            .last()
            .contains('McDuck Manor').should('exist')
            .contains('Duckburg').should('exist')
            .contains('SW1A 1AA').should('exist')

          cy.get('input[type="radio"]')
            .siblings('label')
            .contains('Yes, these organisation details match')
            .prev('input[type="radio"]')
            .check()

          cy.get('#confirm-org-details-form button[type="submit"]').click()
          cy.title().should('eq', 'Settings - Stripe details - GOV.UK Pay')
          cy.get('h1').should('contain', 'Stripe details')
          cy.location('pathname').should('not.contain', '/organisation-details/index')
          cy.get('.govuk-task-list__item')
            .contains('Confirm your organisation\'s name and address match your government entity document')
            .parent()
            .parent()
            .within(() => {
              cy.get('.govuk-task-list__status').should('contain.text', 'Complete')
            })
        })
      })
      describe('When selecting no', () => {
        describe('When submitting valid organisation details', () => {
          beforeEach(() => {
            setStubs({}, [
              ...Array(3).fill(stripeAccountSetupStubs.getStripeSetupProgressByServiceExternalIdAndAccountType({
                serviceExternalId: SERVICE_EXTERNAL_ID,
                accountType: LIVE_ACCOUNT_TYPE
              })),
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
                  path: 'organisation_details',
                  value: true
                }),
              serviceStubs.patchUpdateMerchantDetailsSuccess({
                serviceExternalId: SERVICE_EXTERNAL_ID,
                merchantDetails: {
                  name: 'Glomgold Industries',
                  address_line1: 'McDuck Manor',
                  address_line2: '',
                  address_city: 'Duckburg',
                  address_postcode: 'SW1A 1AA',
                  address_country: 'GB'
                }
              }),
              stripeAccountSetupStubs.getStripeSetupProgressByServiceExternalIdAndAccountType({
                serviceExternalId: SERVICE_EXTERNAL_ID,
                accountType: LIVE_ACCOUNT_TYPE,
                organisationDetails: true
              })
            ])
            cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/organisation-details/index')
          })

          it('should redirect to the task summary page on success', () => {
            cy.get('input[type="radio"]')
              .siblings('label')
              .contains('No, these organisation details do not match')
              .prev('input[type="radio"]')
              .check()

            cy.get('#confirm-org-details-form button[type="submit"]').click()
            cy.location('pathname').should('contain', '/organisation-details/update')
            cy.get('h1').should('contain', 'What is the name and address of your organisation on your government entity document?')

            cy.get('input[name="organisationName"]')
              .should('have.value', 'McDuck Enterprises')
            cy.get('input[name="addressLine1"]')
              .should('have.value', 'McDuck Manor')
            cy.get('input[name="addressCity"]')
              .should('have.value', 'Duckburg')
            cy.get('input[name="addressPostcode"]')
              .should('have.value', 'SW1A 1AA')

            cy.get('input[name="organisationName"]')
              .clear({ force: true })
              .type('Glomgold Industries')

            cy.get('#update-organisation-details-submit').click()
            cy.title().should('eq', 'Settings - Stripe details - GOV.UK Pay')
            cy.get('h1').should('contain', 'Stripe details')
            cy.location('pathname').should('not.contain', '/organisation-details')
            cy.get('.govuk-task-list__item')
              .contains('Confirm your organisation\'s name and address match your government entity document')
              .parent()
              .parent()
              .within(() => {
                cy.get('.govuk-task-list__status').should('contain.text', 'Complete')
              })
          })
        })
        describe('When submitting invalid organisation details', () => {
          beforeEach(() => {
            setStubs({}, [
              stripeAccountSetupStubs.getStripeSetupProgressByServiceExternalIdAndAccountType({
                serviceExternalId: SERVICE_EXTERNAL_ID,
                accountType: LIVE_ACCOUNT_TYPE
              })
            ])
            cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/organisation-details/index')
          })

          it('should render errors when submitting bad inputs', () => {
            const orgNameError = 'Enter an organisation name'
            const addressLine1Error = 'Enter a building and street'
            const addressPostcodeError = 'Enter a postcode'

            cy.get('input[type="radio"]')
              .siblings('label')
              .contains('No, these organisation details do not match')
              .prev('input[type="radio"]')
              .check()

            cy.get('#confirm-org-details-form button[type="submit"]').click()
            cy.location('pathname').should('contain', '/organisation-details/update')
            cy.get('h1').should('contain', 'What is the name and address of your organisation on your government entity document?')

            cy.get('.govuk-error-summary').should('not.exist')

            cy.get('input[name="organisationName"]')
              .clear({ force: true })

            cy.get('input[name="addressLine1"]')
              .clear({ force: true })

            cy.get('input[name="addressPostcode"]')
              .clear({ force: true })

            cy.get('#update-organisation-details-submit').click()
            cy.get('.govuk-error-summary')
              .should('exist')
              .should('contain', orgNameError)
              .should('contain', addressLine1Error)
              .should('contain', addressPostcodeError)
            cy.get('input[name="organisationName"]').should('have.class', 'govuk-input--error')
            cy.get('input[name="addressLine1"]').should('have.class', 'govuk-input--error')
            cy.get('input[name="addressPostcode"]').should('have.class', 'govuk-input--error')
            cy.get('#organisation-name-error').should('contain.text', orgNameError)
            cy.get('#address-line1-error').should('contain.text', addressLine1Error)
            cy.get('#address-postcode-error').should('contain.text', addressPostcodeError)
          })
        })
      })
    })
  })
})
