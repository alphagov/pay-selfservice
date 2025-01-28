const userStubs = require('@test/cypress/stubs/user-stubs')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const stripeAccountSetupStubs = require('@test/cypress/stubs/stripe-account-setup-stub')
const { STRIPE, WORLDPAY } = require('@models/payment-providers')
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
  describe('The government entity document task', () => {
    describe('For a non-admin', () => {
      beforeEach(() => {
        setStubs({
          role: 'view-and-refund'
        })
        cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/government-entity-document', { failOnStatusCode: false })
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
        cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/government-entity-document', { failOnStatusCode: false })
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
            bankAccount: true,
            companyNumber: true,
            vatNumber: true,
            director: true,
            responsiblePerson: true,
            organisationDetails: true,
            governmentEntityDocument: true
          })
        ])
        cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/government-entity-document', { failOnStatusCode: false })
      })
      it('should show the task already completed page', () => {
        cy.title().should('eq', 'An error occurred - GOV.UK Pay')
        cy.get('h1').should('contain', 'You\'ve already completed this task')
      })
    })

    describe('Cannot start yet', () => {
      beforeEach(() => {
        setStubs({}, [
          stripeAccountSetupStubs.getStripeSetupProgressByServiceExternalIdAndAccountType({
            serviceExternalId: SERVICE_EXTERNAL_ID,
            accountType: LIVE_ACCOUNT_TYPE,
            bankAccount: true,
            companyNumber: true,
            vatNumber: true,
            director: false,
            responsiblePerson: false,
            organisationDetails: false,
            governmentEntityDocument: false
          })
        ])
        cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/government-entity-document')
      })
      it('should redirect to the task summary', () => {
        cy.title().should('eq', 'Stripe details - Settings - McDuck Enterprises - GOV.UK Pay')
        cy.get('h1').should('contain', 'Stripe details')
        cy.location('pathname').should('not.contain', '/government-entity-document')
      })
    })
    describe('Not yet started', () => {
      beforeEach(() => {
        setStubs({}, [
          stripeAccountSetupStubs.getStripeSetupProgressByServiceExternalIdAndAccountType({
            serviceExternalId: SERVICE_EXTERNAL_ID,
            accountType: LIVE_ACCOUNT_TYPE,
            bankAccount: true,
            companyNumber: true,
            vatNumber: true,
            director: true,
            responsiblePerson: true,
            organisationDetails: true,
            governmentEntityDocument: false
          })
        ])
        cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/government-entity-document')
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
          cy.title().should('eq', 'Upload a government entity document - Settings - McDuck Enterprises - GOV.UK Pay')
        })
        it('should show the correct heading', () => {
          cy.get('h1').should('contain', 'Upload a government entity document')
        })
      })
      describe('When uploading an invalid file', () => {
        describe('Wrong file type', () => {
          it('should render error', () => {
            const wrongFileTypeError = 'File type must be PDF, JPG or PNG'

            cy.get('input[name="governmentEntityDocument"]').selectFile({
              contents: Cypress.Buffer.from('file contents'),
              fileName: 'file.json'
            })

            cy.get('.govuk-error-summary').should('not.exist')

            cy.get('#government-entity-document-submit').click()

            cy.get('.govuk-error-summary')
              .should('exist')
              .should('contain', '')
              .should('contain', wrongFileTypeError)
            cy.get('input[name="governmentEntityDocument"]').should('have.class', 'govuk-file-upload--error')
            cy.get('#government-entity-document-error').should('contain.text', wrongFileTypeError)
          })
        })
        describe('File too large', () => {
          it('should render error', () => {
            const fileTooLargeError = 'File size must be less than 10MB'
            const moreThan10MB = (10 * 1024 * 1024) + 1
            const largeFile = Cypress.Buffer.alloc(moreThan10MB)
            largeFile.write('a', moreThan10MB)

            cy.get('input[name="governmentEntityDocument"]').selectFile({
              contents: largeFile,
              fileName: 'file.png',
              mimeType: 'image/png'
            })

            cy.get('.govuk-error-summary').should('not.exist')

            cy.get('#government-entity-document-submit').click()

            cy.get('.govuk-error-summary')
              .should('exist')
              .should('contain', '')
              .should('contain', fileTooLargeError)
            cy.get('input[name="governmentEntityDocument"]').should('have.class', 'govuk-file-upload--error')
            cy.get('#government-entity-document-error').should('contain.text', fileTooLargeError)
          })
        })

        describe('File missing', () => {
          it('should render error', () => {
            const fileMissingError = 'Select a file to upload'
            cy.get('.govuk-error-summary').should('not.exist')
            cy.get('#government-entity-document-submit').click()
            cy.get('.govuk-error-summary')
              .should('exist')
              .should('contain', '')
              .should('contain', fileMissingError)
            cy.get('input[name="governmentEntityDocument"]').should('have.class', 'govuk-file-upload--error')
            cy.get('#government-entity-document-error').should('contain.text', fileMissingError)
          })
        })
      })
      describe('When uploading a valid file', () => {
        beforeEach(() => {
          setStubs({}, [
            gatewayAccountStubs.getStripeAccountByServiceIdAndAccountType(
              SERVICE_EXTERNAL_ID,
              LIVE_ACCOUNT_TYPE,
              {
                stripeAccountId: STRIPE_ACCOUNT_ID
              }
            ),
            stripePspStubs.uploadFile(),
            stripePspStubs.updateAccount({
              stripeAccountId: STRIPE_ACCOUNT_ID
            }),
            stripeAccountSetupStubs.patchStripeProgressByServiceExternalIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE,
              {
                path: 'government_entity_document',
                value: true
              }),
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
          cy.visit(STRIPE_DETAILS_SETTINGS_URL + '/government-entity-document')
        })

        it('should redirect to the task summary page on success', () => {
          cy.get('input[name="governmentEntityDocument"]').selectFile({
            contents: Cypress.Buffer.from('file contents'),
            fileName: 'file.png',
            mimeType: 'image/png'
          })

          setStubs({}, [
            stripeAccountSetupStubs.getStripeSetupProgressByServiceExternalIdAndAccountType({
              serviceExternalId: SERVICE_EXTERNAL_ID,
              accountType: LIVE_ACCOUNT_TYPE,
              bankAccount: true,
              companyNumber: true,
              vatNumber: true,
              director: true,
              responsiblePerson: true,
              organisationDetails: true,
              governmentEntityDocument: true
            })
          ])

          cy.get('#government-entity-document-submit').click()

          cy.title().should('eq', 'Stripe details - Settings - McDuck Enterprises - GOV.UK Pay')
          cy.get('h1').should('contain', 'Stripe details')
          cy.location('pathname').should('not.contain', '/government-entity-document')
          cy.get('.govuk-notification-banner')
            .contains('Service connected to Stripe')
            .parent()
            .contains('This service can now take payments')
        })
      })
    })
  })
})
