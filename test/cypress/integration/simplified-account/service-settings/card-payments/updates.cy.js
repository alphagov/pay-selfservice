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
const { patchAccountByServiceIdUpdateApplePaySuccess, patchAccountByServiceIdUpdateGooglePaySuccess } = require('@test/cypress/stubs/gateway-account-stubs')

const baseUrl = `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/card-payments`

describe('Card payment updates', () => {
  beforeEach(() => {
    cy.task('clearStubs')
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  it('should allow update of Collect billing address - on', () => {
    setupStubs({
      collectBillingAddress: false
    })
    cy.task('setupStubs', [
      patchUpdateCollectBillingAddressSuccess({
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        serviceExternalId: SERVICE_EXTERNAL_ID,
        collectBillingAddress: true
      })
    ])
    cy.visit(baseUrl + '/collect-billing-address')
    cy.get('h1').should('contain.text', 'Collect billing address')
    cy.get('.service-settings-nav__li--active').within(() => {
      cy.get('#card-payments').should('contain.text', 'Card payments')
    })
    cy.get('input#collect-billing-address-on').click()
    cy.contains('button', 'Save changes').click()
    cy.get('.govuk-heading-l').should('contain.text', 'Card payments')
  })

  it('should allow update of Collect billing address - off', () => {
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
    cy.get('h1').should('contain.text', 'Collect billing address')
    cy.get('input#collect-billing-address-off').click()
    cy.contains('button', 'Save changes').click()
    cy.get('.govuk-heading-l').should('contain.text', 'Card payments')
  })

  it('should allow update of Default billing address country - on', () => {
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
    cy.get('h1').should('contain.text', 'Default billing address country')
    cy.get('.service-settings-nav__li--active').within(() => {
      cy.get('#card-payments').should('contain.text', 'Card payments')
    })
    cy.get('input#default-billing-address-on').click()
    cy.contains('button', 'Save changes').click()
    cy.get('.govuk-heading-l').should('contain.text', 'Card payments')
  })

  it('should allow update of Default billing address country - off', () => {
    setupStubs({
      isDefaultBillingAddressCountryUK: true
    })
    cy.task('setupStubs', [
      patchUpdateDefaultBillingAddressCountrySuccess({
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        serviceExternalId: SERVICE_EXTERNAL_ID,
        country: null
      })
    ])
    cy.visit(baseUrl + '/default-billing-address-country')
    cy.get('h1').should('contain.text', 'Default billing address country')
    cy.get('input#default-billing-address-off').click()
    cy.contains('button', 'Save changes').click()
    cy.get('.govuk-heading-l').should('contain.text', 'Card payments')
  })

  it('should allow update of Apple Pay', () => {
    setupStubs({
      allowApplePay: false
    })
    cy.task('setupStubs', [
      patchAccountByServiceIdUpdateApplePaySuccess(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, true)
    ])
    cy.visit(baseUrl + '/apple-pay')
    cy.get('h1').should('contain.text', 'Apple Pay')
    cy.get('.service-settings-nav__li--active').within(() => {
      cy.get('#card-payments').should('contain.text', 'Card payments')
    })
    cy.get('input#apple-pay-on').click()
    cy.contains('button', 'Save changes').click()
    cy.get('.govuk-heading-l').should('contain.text', 'Card payments')
  })

  it('should allow update of Google Pay', () => {
    setupStubs({
      allowGooglePay: false
    })
    cy.task('setupStubs', [
      patchAccountByServiceIdUpdateGooglePaySuccess(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, true)
    ])
    cy.visit(baseUrl + '/google-pay')
    cy.get('h1').should('contain.text', 'Google Pay')
    cy.get('.service-settings-nav__li--active').within(() => {
      cy.get('#card-payments').should('contain.text', 'Card payments')
    })
    cy.get('input#google-pay-on').click()
    cy.contains('button', 'Save changes').click()
    cy.get('.govuk-heading-l').should('contain.text', 'Card payments')
  })
})

describe('Card payment updates non-admin access', () => {
  beforeEach(() => {
    cy.task('clearStubs')
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  it('should return 403 for non-admin user - collect billing address', () => {
    setupStubs({
      role: 'view-only'
    })
    cy.request({
      url: baseUrl + '/collect-billing-address',
      failOnStatusCode: false
    }).then((resp) => {
      expect(resp.status).to.eq(403)
    })
  })

  it('should return 403 for non-admin user - default billing address', () => {
    setupStubs({
      role: 'view-only'
    })
    cy.request({
      url: baseUrl + '/default-billing-address-country',
      failOnStatusCode: false
    }).then((resp) => {
      expect(resp.status).to.eq(403)
    })
  })

  it('should return 403 for non-admin user - apple pay', () => {
    setupStubs({
      role: 'view-only'
    })
    cy.request({
      url: baseUrl + '/apple-pay',
      failOnStatusCode: false
    }).then((resp) => {
      expect(resp.status).to.eq(403)
    })
  })

  it('should return 403 for non-admin user - google pay', () => {
    setupStubs({
      role: 'view-only'
    })
    cy.request({
      url: baseUrl + '/google-pay',
      failOnStatusCode: false
    }).then((resp) => {
      expect(resp.status).to.eq(403)
    })
  })
})
