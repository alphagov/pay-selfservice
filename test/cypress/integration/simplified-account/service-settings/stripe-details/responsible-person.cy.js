const userStubs = require('@test/cypress/stubs/user-stubs')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const stripeAccountSetupStubs = require('@test/cypress/stubs/stripe-account-setup-stub')
const { STRIPE, WORLDPAY } = require('@models/constants/payment-providers')
const stripePspStubs = require('@test/cypress/stubs/stripe-psp-stubs')
const ROLES = require('@test/fixtures/roles.fixtures')
const { STRIPE_CREDENTIAL_IN_ACTIVE_STATE } = require('@test/cypress/integration/simplified-account/service-settings/helpers/credential-states')

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const SERVICE_NAME = {
  en: 'McDuck Enterprises', cy: 'Mentrau McDuck'
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
        address_postcode: 'SW1A 1AA'
      },
      role: ROLES[opts.role || 'admin']
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE, {
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      type: LIVE_ACCOUNT_TYPE,
      payment_provider: opts.paymentProvider || STRIPE,
      provider_switch_enabled: opts.providerSwitchEnabled || false,
      gateway_account_credentials: [
        STRIPE_CREDENTIAL_IN_ACTIVE_STATE,
      ]
    }),
    ...additionalStubs])
}

describe('Stripe details settings', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })
  describe('The responsible person task', () => {
    describe('For a non-admin', () => {
      beforeEach(() => {
        setStubs({
          role: 'view-and-refund'
        })
        cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/responsible-person', { failOnStatusCode: false })
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
        cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/responsible-person', { failOnStatusCode: false })
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
            responsiblePerson: true
          })
        ])
        cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/responsible-person')
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
        cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/responsible-person')
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
          cy.title().should('eq', 'Responsible person - Settings - McDuck Enterprises - GOV.UK Pay')
        })
        it('should show the correct heading', () => {
          cy.get('h1').should('contain', 'Responsible person')
        })
      })
      describe('When entering invalid details', () => {
        describe('Name and DOB sub-task', () => {
          it('should render errors when submitting bad inputs', () => {
            const emptyFirstNameError = 'Enter the first name'
            const emptyLastNameError = 'Enter the last name'
            const tooOldError = 'Enter a valid year of birth'

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

            cy.get('#responsible-person-form button[type="submit"]').click()
            cy.get('.govuk-error-summary')
              .should('exist')
              .should('contain', emptyFirstNameError)
              .should('contain', emptyLastNameError)
              .should('contain', tooOldError)
            cy.get('input[name="firstName"]').should('have.class', 'govuk-input--error')
            cy.get('#first-name-error').should('contain.text', emptyFirstNameError)
            cy.get('input[name="lastName"]').should('have.class', 'govuk-input--error')
            cy.get('#last-name-error').should('contain.text', emptyLastNameError)
            cy.get('#dob-error').should('contain.text', tooOldError)
          })
        })

        describe('Home address sub-task', () => {
          beforeEach(() => {
            cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/responsible-person/home-address')
          })

          it('should render errors when submitting bad inputs', () => {
            const emptyAddressError = 'Address line 1 is required'
            const emptyAddressCityError = 'Town or city is required'
            const invalidPostcodeError = 'Enter a real postcode'

            cy.get('.govuk-error-summary').should('not.exist')

            cy.get('input[name="homeAddressLine1"]')
              .clear({ force: true })
            cy.get('input[name="homeAddressCity"]')
              .clear({ force: true })
            cy.get('input[name="homeAddressPostcode"]')
              .clear({ force: true })
              .type('hmmm')

            cy.get('#responsible-person-home-address-form button[type="submit"]').click()
            cy.get('.govuk-error-summary')
              .should('exist')
              .should('contain', emptyAddressError)
              .should('contain', emptyAddressCityError)
              .should('contain', invalidPostcodeError)
            cy.get('input[name="homeAddressLine1"]').should('have.class', 'govuk-input--error')
            cy.get('#home-address-line1-error').should('contain.text', emptyAddressError)
            cy.get('input[name="homeAddressCity"]').should('have.class', 'govuk-input--error')
            cy.get('#home-address-city-error').should('contain.text', emptyAddressCityError)
            cy.get('input[name="homeAddressPostcode"]').should('have.class', 'govuk-input--error')
            cy.get('#home-address-postcode-error').should('contain.text', invalidPostcodeError)
          })
        })

        describe('Phone number and email address sub-task', () => {
          beforeEach(() => {
            cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/responsible-person/contact-details')
          })

          it('should render errors when submitting bad inputs', () => {
            const invalidEmailAddress = 'Enter a real email address'
            const invalidPhoneNumber = 'Enter a valid work telephone number'

            cy.get('.govuk-error-summary').should('not.exist')

            cy.get('input[name="workTelephoneNumber"]')
              .clear({ force: true })
              .type('hmmm')
            cy.get('input[name="workEmail"]')
              .clear({ force: true })
              .type('hmmm')

            cy.get('#responsible-person-contact-details-form button[type="submit"]').click()
            cy.get('.govuk-error-summary')
              .should('exist')
              .should('contain', invalidPhoneNumber)
              .should('contain', invalidEmailAddress)
            cy.get('input[name="workTelephoneNumber"]').should('have.class', 'govuk-input--error')
            cy.get('#work-telephone-number-error').should('contain.text', invalidPhoneNumber)
            cy.get('input[name="workEmail"]').should('have.class', 'govuk-input--error')
            cy.get('#work-email-error').should('contain.text', invalidEmailAddress)
          })
        })

        describe('Check your answers sub-task', () => {
          beforeEach(() => {
            cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/responsible-person/check-your-answers')
          })

          it('should redirect to the Name and DOB sub-task when answers are incomplete', () => {
            cy.location('pathname').should('not.contain', '/check-your-answers')
            cy.get('h1').should('contain', 'Responsible person')
          })
        })
      })
      describe('When entering valid details', () => {
        beforeEach(() => {
          setStubs({}, [
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
              representative: true
            }),
            stripePspStubs.updateAccount({
              stripeAccountId: STRIPE_ACCOUNT_ID
            }),
            stripeAccountSetupStubs.patchStripeProgressByServiceExternalIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE,
              {
                path: 'responsible_person',
                value: true
              })
          ])
          cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/responsible-person')
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

          cy.get('#responsible-person-form button[type="submit"]').click()

          cy.get('input[name="homeAddressLine1"]')
            .clear({ force: true })
            .type('McDuck Manor')
          cy.get('input[name="homeAddressCity"]')
            .clear({ force: true })
            .type('Duckburg')
          cy.get('input[name="homeAddressPostcode"]')
            .clear({ force: true })
            .type('SW1A 1AA')

          cy.get('#responsible-person-home-address-form button[type="submit"]').click()

          cy.get('input[name="workTelephoneNumber"]')
            .clear({ force: true })
            .type('01611234567')
          cy.get('input[name="workEmail"]')
            .clear({ force: true })
            .type('scrooge.mcduck@pay.gov.uk')

          cy.get('#responsible-person-contact-details-form button[type="submit"]').click()

          cy.get('.govuk-summary-list__row').should('have.length', 5)

          cy.get('.govuk-summary-list__row')
            .should('contain.text', 'Scrooge McDuck')

          cy.get('.govuk-summary-list__row')
            .should('contain.text', '01 January 1901')

          cy.get('.govuk-summary-list__row')
            .contains('McDuck Manor').should('exist')
            .contains('Duckburg').should('exist')
            .contains('SW1A 1AA').should('exist')

          cy.get('.govuk-summary-list__row')
            .should('contain.text', '+44 161 123 4567')

          cy.get('.govuk-summary-list__row')
            .should('contain.text', 'scrooge.mcduck@pay.gov.uk')

          setStubs({}, [
            stripeAccountSetupStubs.getStripeSetupProgressByServiceExternalIdAndAccountType({
              serviceExternalId: SERVICE_EXTERNAL_ID,
              accountType: LIVE_ACCOUNT_TYPE,
              responsiblePerson: true
            })
          ])

          cy.get('#responsible-person-check-your-answers-form button[type="submit"]').click()

          cy.title().should('eq', 'Stripe details - Settings - McDuck Enterprises - GOV.UK Pay')
          cy.get('h1').should('contain', 'Stripe details')
          cy.location('pathname').should('not.contain', '/responsible-person')
          cy.get('.govuk-task-list__item')
            .contains('Responsible person')
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
