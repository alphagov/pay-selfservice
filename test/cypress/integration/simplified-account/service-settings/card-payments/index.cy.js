const {
  setupStubs,
  USER_EXTERNAL_ID,
  SERVICE_EXTERNAL_ID,
  ACCOUNT_TYPE
} = require('@test/cypress/integration/simplified-account/service-settings/card-payments/util')

const pageUrl = `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/card-payments`

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
          role: 'admin',
          collectBillingAddress: true,
          isDefaultBillingAddressCountryUK: true,
          allowApplePay: true,
          allowGooglePay: true,
          serviceName: 'version 1'
        })
        cy.visit(pageUrl)
        cy.get('.govuk-summary-list').eq(0).within(() => {
          cy.get('.govuk-summary-list__row').eq(0).within(() => {
            cy.get('.govuk-summary-list__key').should('contain', 'Collect billing address')
            cy.get('.govuk-summary-list__value').should('contain', 'On')
            cy.get('.govuk-summary-list__actions').should('contain', 'Change')
          })
          cy.get('.govuk-summary-list__row').eq(1).within(() => {
            cy.get('.govuk-summary-list__key').should('contain', 'Default billing address country')
            cy.get('.govuk-summary-list__value').should('contain', 'United Kingdom')
            cy.get('.govuk-summary-list__actions').should('contain', 'Change')
          })
        })
        cy.get('.govuk-summary-list').eq(1).within(() => {
          cy.get('.govuk-summary-list__row').eq(0).within(() => {
            cy.get('.govuk-summary-list__key').should('contain', 'Apple Pay')
            cy.get('.govuk-summary-list__value').should('contain', 'On')
            cy.get('.govuk-summary-list__actions').should('contain', 'Change')
          })
          cy.get('.govuk-summary-list__row').eq(1).within(() => {
            cy.get('.govuk-summary-list__key').should('contain', 'Google Pay')
            cy.get('.govuk-summary-list__value').should('contain', 'On')
            cy.get('.govuk-summary-list__actions').should('contain', 'Change')
          })
        })
      })

      it('should display the provided card payment details (version 2 - everything off)', () => {
        setupStubs({
          role: 'admin',
          collectBillingAddress: false,
          isDefaultBillingAddressCountryUK: false,
          allowApplePay: false,
          allowGooglePay: false,
          serviceName: 'version 2'
        })

        cy.visit(pageUrl)
        cy.get('.govuk-summary-list').eq(0).within(() => {
          cy.get('.govuk-summary-list__row').eq(0).within(() => {
            cy.get('.govuk-summary-list__key').should('contain', 'Collect billing address')
            cy.get('.govuk-summary-list__value').should('contain', 'Off')
            cy.get('.govuk-summary-list__actions').should('contain', 'Change')
          })
          cy.get('.govuk-summary-list__row').eq(1).within(() => {
            cy.get('.govuk-summary-list__key').should('contain', 'Default billing address country')
            cy.get('.govuk-summary-list__value').should('contain', 'None')
            cy.get('.govuk-summary-list__actions').should('contain', 'Change')
          })
        })
        cy.get('.govuk-summary-list').eq(1).within(() => {
          cy.get('.govuk-summary-list__row').eq(0).within(() => {
            cy.get('.govuk-summary-list__key').should('contain', 'Apple Pay')
            cy.get('.govuk-summary-list__value').should('contain', 'Off')
            cy.get('.govuk-summary-list__actions').should('contain', 'Change')
          })
          cy.get('.govuk-summary-list__row').eq(1).within(() => {
            cy.get('.govuk-summary-list__key').should('contain', 'Google Pay')
            cy.get('.govuk-summary-list__value').should('contain', 'Off')
            cy.get('.govuk-summary-list__actions').should('contain', 'Change')
          })
        })
      })
    })
    describe('for a non-admin user', () => {
      it('should show the correct heading and title', () => {
        setupStubs()
        cy.visit(pageUrl)
        cy.get('h1').should('contain.text', 'Card payments')
        cy.title().should('eq', 'Card payments - Settings - My card payment service - GOV.UK Pay')
      })

      it('should display the provided card payment details (version 1 - everything on)', () => {
        setupStubs({
          role: 'view-only',
          collectBillingAddress: true,
          isDefaultBillingAddressCountryUK: true,
          allowApplePay: true,
          allowGooglePay: true,
          serviceName: 'version 1'
        })
        cy.visit(pageUrl)
        cy.get('.govuk-summary-list').eq(0).within(() => {
          cy.get('.govuk-summary-list__row').eq(0).within(() => {
            cy.get('.govuk-summary-list__key').should('contain', 'Collect billing address')
            cy.get('.govuk-summary-list__value').should('contain', 'On')
            cy.get('.govuk-summary-list__actions').should('not.exist')
          })
          cy.get('.govuk-summary-list__row').eq(1).within(() => {
            cy.get('.govuk-summary-list__key').should('contain', 'Default billing address country')
            cy.get('.govuk-summary-list__value').should('contain', 'United Kingdom')
            cy.get('.govuk-summary-list__actions').should('not.exist')
          })
        })
        cy.get('.govuk-summary-list').eq(1).within(() => {
          cy.get('.govuk-summary-list__row').eq(0).within(() => {
            cy.get('.govuk-summary-list__key').should('contain', 'Apple Pay')
            cy.get('.govuk-summary-list__value').should('contain', 'On')
            cy.get('.govuk-summary-list__actions').should('not.exist')
          })
          cy.get('.govuk-summary-list__row').eq(1).within(() => {
            cy.get('.govuk-summary-list__key').should('contain', 'Google Pay')
            cy.get('.govuk-summary-list__value').should('contain', 'On')
            cy.get('.govuk-summary-list__actions').should('not.exist')
          })
        })
      })

      it('should display the provided card payment details (version 2 - everything off)', () => {
        setupStubs({
          role: 'view-only',
          collectBillingAddress: false,
          isDefaultBillingAddressCountryUK: false,
          allowApplePay: false,
          allowGooglePay: false,
          serviceName: 'version 2'
        })

        cy.visit(pageUrl)
        cy.get('.govuk-summary-list').eq(0).within(() => {
          cy.get('.govuk-summary-list__row').eq(0).within(() => {
            cy.get('.govuk-summary-list__key').should('contain', 'Collect billing address')
            cy.get('.govuk-summary-list__value').should('contain', 'Off')
            cy.get('.govuk-summary-list__actions').should('not.exist', 'Change')
          })
          cy.get('.govuk-summary-list__row').eq(1).within(() => {
            cy.get('.govuk-summary-list__key').should('contain', 'Default billing address country')
            cy.get('.govuk-summary-list__value').should('contain', 'None')
            cy.get('.govuk-summary-list__actions').should('not.exist', 'Change')
          })
        })
        cy.get('.govuk-summary-list').eq(1).within(() => {
          cy.get('.govuk-summary-list__row').eq(0).within(() => {
            cy.get('.govuk-summary-list__key').should('contain', 'Apple Pay')
            cy.get('.govuk-summary-list__value').should('contain', 'Off')
            cy.get('.govuk-summary-list__actions').should('not.exist', 'Change')
          })
          cy.get('.govuk-summary-list__row').eq(1).within(() => {
            cy.get('.govuk-summary-list__key').should('contain', 'Google Pay')
            cy.get('.govuk-summary-list__value').should('contain', 'Off')
            cy.get('.govuk-summary-list__actions').should('not.exist', 'Change')
          })
        })
      })
    })
  })
})
