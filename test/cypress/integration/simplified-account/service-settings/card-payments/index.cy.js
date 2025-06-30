const {
  setupStubs,
  USER_EXTERNAL_ID,
  SERVICE_EXTERNAL_ID,
  ACCOUNT_TYPE,
} = require('@test/cypress/integration/simplified-account/service-settings/card-payments/util')
const { WORLDPAY } = require('@models/constants/payment-providers')
const {
  WORLDPAY_CREDENTIAL_IN_CREATED_STATE,
} = require('@test/fixtures/credential-states')
const checkSettingsNavigation = require('@test/cypress/integration/simplified-account/service-settings/helpers/check-settings-nav')

const pageUrl = `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/card-payments`

const cardPaymentParams = [
  {
    title: 'Collect billing address',
    url: '/collect-billing-address',
    listLocation: [0, 0],
    onValue: 'On',
    offValue: 'Off',
  },
  {
    title: 'Default billing address country',
    url: '/default-billing-address-country',
    listLocation: [0, 1],
    onValue: 'United Kingdom',
    offValue: 'None',
  },
  {
    title: 'Apple Pay',
    url: '/apple-pay',
    listLocation: [1, 0],
    onValue: 'On',
    offValue: 'Off',
  },
  {
    title: 'Google Pay',
    url: '/google-pay',
    listLocation: [1, 1],
    onValue: 'On',
    offValue: 'Off',
  },
]

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

      it('should show active "Card payments" link in the setting navigation', () => {
        setupStubs()
        cy.visit(pageUrl)
        checkSettingsNavigation(
          'Card payments',
          pageUrl
        )
      })

      it('should display the provided card payment details (version 1 - everything on)', () => {
        setupStubs({
          role: 'admin',
          collectBillingAddress: true,
          isDefaultBillingAddressCountryUK: true,
          allowApplePay: true,
          allowGooglePay: true,
          serviceName: 'version 1',
        })
        cy.visit(pageUrl)
        cardPaymentParams.forEach((param) => {
          cy.get(`.govuk-summary-list:eq(${param.listLocation[0]})`)
            .find(`.govuk-summary-list__row:eq(${param.listLocation[1]})`)
            .within(() => {
              cy.get('.govuk-summary-list__key').should('contain', param.title)
              cy.get('.govuk-summary-list__value').should('contain', param.onValue)
              cy.get('.govuk-summary-list__actions a')
                .should('have.attr', 'href', `${pageUrl}${param.url}`)
                .should('contain', 'Change')
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
          serviceName: 'version 2',
        })

        cy.visit(pageUrl)
        cardPaymentParams.forEach((param) => {
          cy.get(`.govuk-summary-list:eq(${param.listLocation[0]})`)
            .find(`.govuk-summary-list__row:eq(${param.listLocation[1]})`)
            .within(() => {
              cy.get('.govuk-summary-list__key').should('contain', param.title)
              cy.get('.govuk-summary-list__value').should('contain', param.offValue)
              cy.get('.govuk-summary-list__actions a')
                .should('have.attr', 'href', `${pageUrl}${param.url}`)
                .should('contain', 'Change')
            })
        })
      })

      it('should navigate to card payment details and return', () => {
        setupStubs({
          role: 'admin',
          collectBillingAddress: false,
          isDefaultBillingAddressCountryUK: false,
          allowApplePay: false,
          allowGooglePay: false,
          serviceName: 'version 2',
        })
        cy.visit(pageUrl)
        cardPaymentParams.forEach((param) => {
          cy.get(`.govuk-summary-list:eq(${param.listLocation[0]})`)
            .find(`.govuk-summary-list__row:eq(${param.listLocation[1]})`)
            .find('.govuk-summary-list__actions a')
            .click()
          cy.get('h1').should('contain.text', param.title)
          cy.get('a.govuk-back-link').click()
          cy.url().should('contain', pageUrl)
        })
      })
    })

    describe('for an admin user of a worldpay account without an active credential', () => {
      it('should inform the user that google pay cannot be set up without entering their worldpay details', () => {
        setupStubs({
          role: 'admin',
          allowGooglePay: false,
          serviceName: 'worldpay service without active credential',
          gatewayAccountPaymentProvider: WORLDPAY,
          gatewayAccountCredentials: [WORLDPAY_CREDENTIAL_IN_CREATED_STATE],
        })

        cy.visit(pageUrl)
        cy.contains('.govuk-summary-list__key', 'Google Pay')
          .parent()
          .within(() => {
            cy.contains('Off (complete Worldpay details to switch on)').should('exist')
            cy.contains('a', 'Change').should('not.exist')
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

      it('should show active "Card payments" link in the setting navigation', () => {
        setupStubs()
        cy.visit(pageUrl)
        checkSettingsNavigation(
          'Card payments',
          pageUrl
        )
      })

      it('should display the provided card payment details (version 1 - everything on)', () => {
        setupStubs({
          role: 'view-only',
          collectBillingAddress: true,
          isDefaultBillingAddressCountryUK: true,
          allowApplePay: true,
          allowGooglePay: true,
          serviceName: 'version 1',
        })
        cy.visit(pageUrl)
        cardPaymentParams.forEach((param) => {
          cy.get(`.govuk-summary-list:eq(${param.listLocation[0]})`)
            .find(`.govuk-summary-list__row:eq(${param.listLocation[1]})`)
            .within(() => {
              cy.get('.govuk-summary-list__key').should('contain', param.title)
              cy.get('.govuk-summary-list__value').should('contain', param.onValue)
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
          serviceName: 'version 2',
        })

        cy.visit(pageUrl)
        cardPaymentParams.forEach((param) => {
          cy.get(`.govuk-summary-list:eq(${param.listLocation[0]})`)
            .find(`.govuk-summary-list__row:eq(${param.listLocation[1]})`)
            .within(() => {
              cy.get('.govuk-summary-list__key').should('contain', param.title)
              cy.get('.govuk-summary-list__value').should('contain', param.offValue)
              cy.get('.govuk-summary-list__actions').should('not.exist')
            })
        })
      })
    })
  })
})
