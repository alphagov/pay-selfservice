const {
  setupStubs,
  USER_EXTERNAL_ID,
  GATEWAY_ACCOUNT_ID,
  SERVICE_EXTERNAL_ID,
  ACCOUNT_TYPE
} = require('@test/cypress/integration/simplified-account/service-settings/card-payments/util')
const {
  patchUpdateDefaultBillingAddressCountrySuccess,
  patchUpdateCollectBillingAddressSuccess
} = require('@test/cypress/stubs/service-stubs')
const { patchAccountUpdateApplePaySuccess, patchAccountUpdateGooglePaySuccess } = require('@test/cypress/stubs/gateway-account-stubs')

const baseUrl = `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/card-payments`

describe('Card payment updates', () => {
  beforeEach(() => {
    cy.task('clearStubs')
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  it('should allow update of Collect billing address', () => {
    setupStubs({
      collectBillingAddress: true
    })
    cy.task('setupStubs', [
      patchUpdateCollectBillingAddressSuccess({
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        serviceExternalId: SERVICE_EXTERNAL_ID,
        collectBillingAddress: false
      })
    ])
    cy.visit(baseUrl + '/collect-billing-address')
    cy.get('h1').should('contain.text', 'Billing address')
    cy.get('input#collect-billing-address-off').click()
    cy.contains('button', 'Save changes').click()
    cy.get('#govuk-notification-banner-title').should('contain.text', 'Success')
  })

  it('should allow update of Default billing address country', () => {
    setupStubs({
      isDefaultBillingAddressCountryUK: false
    })
    cy.task('setupStubs', [
      patchUpdateDefaultBillingAddressCountrySuccess({
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        serviceExternalId: SERVICE_EXTERNAL_ID,
        country: 'GB'
      })
    ])
    cy.visit(baseUrl + '/default-billing-address-country')
    cy.get('h1').should('contain.text', 'Set United Kingdom as the default billing address country')
    cy.get('input#default-billing-address-on').click()
    cy.contains('button', 'Save changes').click()
    cy.get('#govuk-notification-banner-title').should('contain.text', 'Success')
  })

  it('should allow update of Apple Pay', () => {
    setupStubs({
      allowApplePay: false
    })
    cy.task('setupStubs', [
      patchAccountUpdateApplePaySuccess(GATEWAY_ACCOUNT_ID, true)
    ])
    cy.visit(baseUrl + '/apple-pay')
    cy.get('h1').should('contain.text', 'Apple Pay')
    cy.get('input#apple-pay-on').click()
    cy.contains('button', 'Save changes').click()
    cy.get('#govuk-notification-banner-title').should('contain.text', 'Success')
  })

  it('should allow update of Google Pay', () => {
    setupStubs({
      allowGooglePay: false
    })
    cy.task('setupStubs', [
      patchAccountUpdateGooglePaySuccess(GATEWAY_ACCOUNT_ID, true)
    ])
    cy.visit(baseUrl + '/google-pay')
    cy.get('h1').should('contain.text', 'Google Pay')
    cy.get('input#google-pay-on').click()
    cy.contains('button', 'Save changes').click()
    cy.get('#govuk-notification-banner-title').should('contain.text', 'Success')
  })
})
