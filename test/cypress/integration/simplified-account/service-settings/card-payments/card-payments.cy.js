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
        cy.title().should('eq', 'Settings - Card payments - GOV.UK Pay')
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
        assertSummaryListsEqual([
          [
            {
              key: 'Collect billing address',
              value: 'On'
            },
            {
              key: 'Default billing address country',
              value: 'United Kingdom'
            }
          ],
          [

            {
              key: 'Apple Pay',
              value: 'On'
            },
            {
              key: 'Google Pay',
              value: 'On'
            }
          ]
        ])
      })

      it('should display the provided card payment details (version 2 -everything off)', () => {
        setupStubs({
          collectBillingAddress: false,
          defaultBillingAddressCountry: 'IE',
          allowApplePay: false,
          allowGooglePay: false,
          serviceName: 'version 2'
        })

        cy.visit(pageUrl)
        assertSummaryListsEqual([
          [
            {
              key: 'Collect billing address',
              value: 'Off'
            },
            {
              key: 'Default billing address country',
              value: 'IE'
            }
          ],
          [

            {
              key: 'Apple Pay',
              value: 'Off'
            },
            {
              key: 'Google Pay',
              value: 'Off'
            }
          ]
        ])
      })
    })

    // describe('for a non-admin user', () => {
    //   beforeEach(() => {
    //     setupStubs({
    //       role: 'view-and-refund'
    //     })
    //   })
    //
    //   it('should return a 403', () => {
    //     cy.request({
    //       url: pageUrl,
    //       failOnStatusCode: false
    //     }).then(response => expect(response.status).to.eq(403))
    //   })
    // })
  })
})

function assertSummaryListsEqual (expectation) {
  expectation.forEach((currentSummaryListExpectations, summaryListIndex) => {
    currentSummaryListExpectations.forEach((currentRowExpectations, currentRowIndex) => {
      const currentRowExpectationsKeys = Object.keys(currentRowExpectations)
      if (!currentRowExpectationsKeys.includes('key') || !currentRowExpectationsKeys.includes('value') || currentRowExpectationsKeys.lenght > 2) {
        throw new Error(`Row expectations *must* (currently) be "key" and "value".  [${currentRowExpectationsKeys.join(', ')}] provided`)
      }
      cy.get('.govuk-summary-list').eq(summaryListIndex).within(() => {
        cy.get('.govuk-summary-list__row').eq(currentRowIndex).within(() => {
          cy.get('.govuk-summary-list__key').should('contain', currentRowExpectations.key)
          cy.get('.govuk-summary-list__value').should('contain', currentRowExpectations.value)
        })
      })
    })
  })
}
