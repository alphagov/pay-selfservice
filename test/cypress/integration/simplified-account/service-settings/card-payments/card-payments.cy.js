const userStubs = require('@test/cypress/stubs/user-stubs')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const ROLES = require('@test/fixtures/roles.fixtures')

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service-456-def'
const GATEWAY_ACCOUNT_ID = 11
const ACCOUNT_TYPE = 'test'

const pageUrl = `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/card-payments`

const setupStubs = ({
  role,
  collectBillingAddress,
  defaultBillingAddressCountry,
  allowApplePay,
  allowGooglePay,
  serviceName
} = {}) => {
  cy.task('setupStubs', [
    userStubs.getUserSuccess({
      userExternalId: USER_EXTERNAL_ID,
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      serviceName: { en: serviceName ?? 'My card payment service' },
      serviceExternalId: SERVICE_EXTERNAL_ID,
      role: ROLES[role ?? 'admin'],
      collectBillingAddress: collectBillingAddress ?? true,
      defaultBillingAddressCountry: defaultBillingAddressCountry ?? 'GB',
      features: 'degatewayaccountification' // TODO remove features once simplified accounts are live
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, {
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      allow_apple_pay: allowApplePay ?? true,
      allow_google_pay: allowGooglePay ?? true
    })
  ])
}

describe('Card payments page', () => {
  beforeEach(() => {
    cy.task('clearStubs')
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  describe('Card payments landing page', () => {
    describe('for an admin user', () => {
      it('should show the correct heading and title', () => {
        setupStubs()
        cy.visit(pageUrl)

        cy.get('h1').should('contain.text', 'Card payments')
        cy.title().should('eq', 'Card payments - Settings - My card payment service - GOV.UK Pay')
      })

      it('should display the provided card payment details (version 1 - everything on)', () => {
        setupStubs({
          collectBillingAddress: true,
          defaultBillingAddressCountry: 'GB',
          allowApplePay: true,
          allowGooglePay: true,
          serviceName: 'version 1'
        })
        cy.visit(pageUrl)
        cy.get('.govuk-summary-list').eq(0).within(() => {
          cy.get('.govuk-summary-list__row').eq(0).within(() => {
            cy.get('.govuk-summary-list__key').should('contain', 'Collect billing address')
            cy.get('.govuk-summary-list__value').should('contain', 'On')
          })
          cy.get('.govuk-summary-list__row').eq(1).within(() => {
            cy.get('.govuk-summary-list__key').should('contain', 'Default billing address country')
            cy.get('.govuk-summary-list__value').should('contain', 'United Kingdom')
          })
        })
        cy.get('.govuk-summary-list').eq(1).within(() => {
          cy.get('.govuk-summary-list__row').eq(0).within(() => {
            cy.get('.govuk-summary-list__key').should('contain', 'Apple Pay')
            cy.get('.govuk-summary-list__value').should('contain', 'On')
          })
          cy.get('.govuk-summary-list__row').eq(1).within(() => {
            cy.get('.govuk-summary-list__key').should('contain', 'Google Pay')
            cy.get('.govuk-summary-list__value').should('contain', 'On')
          })
        })
      })

      it('should display the provided card payment details (version 2 - everything off)', () => {
        setupStubs({
          collectBillingAddress: false,
          defaultBillingAddressCountry: 'IE',
          allowApplePay: false,
          allowGooglePay: false,
          serviceName: 'version 2'
        })

        cy.visit(pageUrl)
        cy.get('.govuk-summary-list').eq(0).within(() => {
          cy.get('.govuk-summary-list__row').eq(0).within(() => {
            cy.get('.govuk-summary-list__key').should('contain', 'Collect billing address')
            cy.get('.govuk-summary-list__value').should('contain', 'Off')
          })
          cy.get('.govuk-summary-list__row').eq(1).within(() => {
            cy.get('.govuk-summary-list__key').should('contain', 'Default billing address country')
            cy.get('.govuk-summary-list__value').should('contain', 'IE')
          })
        })
        cy.get('.govuk-summary-list').eq(1).within(() => {
          cy.get('.govuk-summary-list__row').eq(0).within(() => {
            cy.get('.govuk-summary-list__key').should('contain', 'Apple Pay')
            cy.get('.govuk-summary-list__value').should('contain', 'Off')
          })
          cy.get('.govuk-summary-list__row').eq(1).within(() => {
            cy.get('.govuk-summary-list__key').should('contain', 'Google Pay')
            cy.get('.govuk-summary-list__value').should('contain', 'Off')
          })
        })
      })
    })
  })
})
