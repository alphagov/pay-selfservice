const {
  setupStubs,
  USER_EXTERNAL_ID,
  GATEWAY_ACCOUNT_ID,
  SERVICE_EXTERNAL_ID,
  ACCOUNT_TYPE,
} = require('@test/cypress/integration/simplified-account/service-settings/card-payments/util')
const {
  patchUpdateDefaultBillingAddressCountrySuccess,
  patchUpdateCollectBillingAddressSuccess,
} = require('@test/cypress/stubs/service-stubs')
const {
  patchAccountByServiceExternalIdAndAccountTypeUpdateApplePaySuccess,
  patchAccountByServiceExternalIdAndAccountTypeUpdateGooglePaySuccess,
  patchAccountByServiceExternalIdAndAccountTypeUpdateGooglePayMerchantIdSuccess,
  patchAccountByServiceExternalIdAndAccountTypeUpdateMaskCardNumberSuccess,
  patchAccountByServiceExternalIdAndAccountTypeUpdateMaskCardSecurityCodeSuccess,
} = require('@test/cypress/stubs/gateway-account-stubs')
const { WORLDPAY, STRIPE } = require('@models/constants/payment-providers')
const {
  WORLDPAY_CREDENTIAL_IN_ACTIVE_STATE,
  WORLDPAY_CREDENTIAL_IN_CREATED_STATE,
} = require('@test/cypress/integration/simplified-account/service-settings/helpers/credential-states')
const checkSettingsNavigation = require('@test/cypress/integration/simplified-account/service-settings/helpers/check-settings-nav')

const baseUrl = `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/card-payments`

describe('Card payment updates', () => {
  beforeEach(() => {
    cy.task('clearStubs')
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  it('should allow update of Collect billing address - on', () => {
    setupStubs({
      collectBillingAddress: false,
    })
    cy.task('setupStubs', [
      patchUpdateCollectBillingAddressSuccess({
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        serviceExternalId: SERVICE_EXTERNAL_ID,
        collectBillingAddress: true,
      }),
    ])
    cy.visit(baseUrl + '/collect-billing-address')
    cy.get('h1').should('contain.text', 'Collect billing address')
    checkSettingsNavigation('Card payments', baseUrl)
    cy.get('input#collect-billing-address-on').click()
    cy.contains('button', 'Save changes').click()
    cy.get('.govuk-heading-l').should('contain.text', 'Card payments')
  })

  it('should allow update of Collect billing address - off', () => {
    setupStubs({
      collectBillingAddress: true,
    })
    cy.task('setupStubs', [
      patchUpdateCollectBillingAddressSuccess({
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        serviceExternalId: SERVICE_EXTERNAL_ID,
        collectBillingAddress: false,
      }),
    ])
    cy.visit(baseUrl + '/collect-billing-address')
    cy.get('h1').should('contain.text', 'Collect billing address')
    cy.get('input#collect-billing-address-off').click()
    cy.contains('button', 'Save changes').click()
    cy.get('.govuk-heading-l').should('contain.text', 'Card payments')
  })

  it('should allow update of Default billing address country - on', () => {
    setupStubs({
      isDefaultBillingAddressCountryUK: false,
    })
    cy.task('setupStubs', [
      patchUpdateDefaultBillingAddressCountrySuccess({
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        serviceExternalId: SERVICE_EXTERNAL_ID,
        country: 'GB',
      }),
    ])
    cy.visit(baseUrl + '/default-billing-address-country')
    cy.get('h1').should('contain.text', 'Default billing address country')
    cy.get('input#default-billing-address-on').click()
    cy.contains('button', 'Save changes').click()
    cy.get('.govuk-heading-l').should('contain.text', 'Card payments')
  })

  it('should allow update of Default billing address country - off', () => {
    setupStubs({
      isDefaultBillingAddressCountryUK: true,
    })
    cy.task('setupStubs', [
      patchUpdateDefaultBillingAddressCountrySuccess({
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        serviceExternalId: SERVICE_EXTERNAL_ID,
        country: null,
      }),
    ])
    cy.visit(baseUrl + '/default-billing-address-country')
    cy.get('h1').should('contain.text', 'Default billing address country')
    cy.get('input#default-billing-address-off').click()
    cy.contains('button', 'Save changes').click()
    cy.get('.govuk-heading-l').should('contain.text', 'Card payments')
  })

  it('should allow update of Apple Pay', () => {
    setupStubs({
      allowApplePay: false,
    })
    cy.task('setupStubs', [
      patchAccountByServiceExternalIdAndAccountTypeUpdateApplePaySuccess(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, true),
    ])
    cy.visit(baseUrl + '/apple-pay')
    cy.get('h1').should('contain.text', 'Apple Pay')
    checkSettingsNavigation('Card payments', baseUrl)
    cy.get('input#apple-pay-on').click()
    cy.contains('button', 'Save changes').click()
    cy.get('.govuk-heading-l').should('contain.text', 'Card payments')
  })

  it('should allow update of Google Pay with active Stripe credential', () => {
    setupStubs({
      allowGooglePay: false,
      gatewayAccountPaymentProvider: STRIPE,
    })
    cy.task('setupStubs', [
      patchAccountByServiceExternalIdAndAccountTypeUpdateGooglePaySuccess(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, true),
    ])
    cy.visit(baseUrl + '/google-pay')
    cy.get('h1').should('contain.text', 'Google Pay')
    checkSettingsNavigation('Card payments', baseUrl)
    cy.get('input#google-pay-on').click()
    cy.contains('button', 'Save changes').click()
    cy.get('.govuk-heading-l').should('contain.text', 'Card payments')
  })

  it('should allow update of Google Pay with active Worldpay credential', () => {
    const googlePayMerchantId = '0123456789abcde'
    const googlePayMerchantIdError = 'Enter a Google Pay merchant ID'
    setupStubs({
      allowGooglePay: false,
      gatewayAccountPaymentProvider: WORLDPAY,
      gatewayAccountCredentials: [WORLDPAY_CREDENTIAL_IN_ACTIVE_STATE],
    })
    cy.task('setupStubs', [
      patchAccountByServiceExternalIdAndAccountTypeUpdateGooglePaySuccess(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, true),
      patchAccountByServiceExternalIdAndAccountTypeUpdateGooglePayMerchantIdSuccess(
        SERVICE_EXTERNAL_ID,
        ACCOUNT_TYPE,
        WORLDPAY_CREDENTIAL_IN_ACTIVE_STATE.external_id,
        {
          googlePayMerchantId,
          userExternalId: USER_EXTERNAL_ID,
        }
      ),
    ])
    cy.visit(baseUrl + '/google-pay')
    cy.get('h1').should('contain.text', 'Google Pay')
    checkSettingsNavigation('Card payments', baseUrl)
    cy.get('.govuk-error-summary').should('not.exist')
    cy.get('input#google-pay-on').click()
    cy.contains('button', 'Save changes').click()
    cy.get('.govuk-error-summary').should('exist').should('contain', googlePayMerchantIdError)
    cy.get('input#google-pay-merchant-id').should('have.class', 'govuk-input--error')
    cy.get('#google-pay-merchant-id-error').should('contain.text', googlePayMerchantIdError)
    cy.get('input#google-pay-merchant-id').click().clear({ force: true }).type(googlePayMerchantId)
    cy.contains('button', 'Save changes').click()
    cy.get('.govuk-heading-l').should('contain.text', 'Card payments')
  })

  it('should redirect to card payments settings index when accessing Google Pay with inactive Worldpay credential', () => {
    setupStubs({
      allowGooglePay: false,
      gatewayAccountPaymentProvider: WORLDPAY,
      gatewayAccountCredentials: [WORLDPAY_CREDENTIAL_IN_CREATED_STATE],
    })
    cy.request({
      method: 'GET',
      url: baseUrl + '/google-pay',
      followRedirect: false,
    }).then((res) => {
      expect(res.status).to.eq(302)
      expect(res.headers.location).to.include('/card-payments')
      expect(res.headers.location).to.not.include('/google-pay')
    })
  })

  describe('Moto Security', () => {
    describe('Moto enabled gateway account', () => {
      it('should allow update of Hide card number', () => {
        setupStubs({
          allowMoto: true,
        })
        cy.task('setupStubs', [
          patchAccountByServiceExternalIdAndAccountTypeUpdateMaskCardNumberSuccess(
            SERVICE_EXTERNAL_ID,
            ACCOUNT_TYPE,
            true
          ),
        ])
        cy.task('setupStubs', [])
        cy.visit(baseUrl + '/moto-security/hide-card-number')
        checkSettingsNavigation('Card payments', baseUrl)
        cy.get('input#hide-card-number-on').click()
        cy.contains('button', 'Save changes').click()
        cy.get('.govuk-heading-l').should('contain.text', 'Card payments')
      })

      it('should allow update of Hide card security code', () => {
        setupStubs({
          allowMoto: true,
        })
        cy.task('setupStubs', [
          patchAccountByServiceExternalIdAndAccountTypeUpdateMaskCardSecurityCodeSuccess(
            SERVICE_EXTERNAL_ID,
            ACCOUNT_TYPE,
            true
          ),
        ])
        cy.task('setupStubs', [])
        cy.visit(baseUrl + '/moto-security/hide-card-security-code')
        checkSettingsNavigation('Card payments', baseUrl)
        cy.get('input#hide-card-security-code-on').click()
        cy.contains('button', 'Save changes').click()
        cy.get('.govuk-heading-l').should('contain.text', 'Card payments')
      })
    })

    describe('Non-moto enabled gateway account', () => {
      it('should return 404 when accessing Hide card number', () => {
        setupStubs({
          allowMoto: false,
        })
        cy.request({
          url: baseUrl + '/moto-security/hide-card-number',
          failOnStatusCode: false,
        }).then((resp) => {
          expect(resp.status).to.eq(404)
          cy.visit(baseUrl + '/moto-security/hide-card-number', { failOnStatusCode: false })
          cy.title().should('eq', 'Page not found - GOV.UK Pay')
          cy.get('h1').should('contain.text', 'Page not found')
        })
      })

      it('should return 404 when accessing Hide card security code', () => {
        setupStubs({
          allowMoto: false,
        })
        cy.request({
          url: baseUrl + '/moto-security/hide-card-security-code',
          failOnStatusCode: false,
        }).then((resp) => {
          expect(resp.status).to.eq(404)
          cy.visit(baseUrl + '/moto-security/hide-card-security-code', { failOnStatusCode: false })
          cy.title().should('eq', 'Page not found - GOV.UK Pay')
          cy.get('h1').should('contain.text', 'Page not found')
        })
      })
    })
  })
})

describe('Card payment updates non-admin access', () => {
  beforeEach(() => {
    cy.task('clearStubs')
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  it('should return 403 for non-admin user - collect billing address', () => {
    setupStubs({
      role: 'view-only',
    })
    cy.request({
      url: baseUrl + '/collect-billing-address',
      failOnStatusCode: false,
    }).then((resp) => {
      expect(resp.status).to.eq(403)
    })
  })

  it('should return 403 for non-admin user - default billing address', () => {
    setupStubs({
      role: 'view-only',
    })
    cy.request({
      url: baseUrl + '/default-billing-address-country',
      failOnStatusCode: false,
    }).then((resp) => {
      expect(resp.status).to.eq(403)
    })
  })

  it('should return 403 for non-admin user - apple pay', () => {
    setupStubs({
      role: 'view-only',
    })
    cy.request({
      url: baseUrl + '/apple-pay',
      failOnStatusCode: false,
    }).then((resp) => {
      expect(resp.status).to.eq(403)
    })
  })

  it('should return 403 for non-admin user - google pay', () => {
    setupStubs({
      role: 'view-only',
    })
    cy.request({
      url: baseUrl + '/google-pay',
      failOnStatusCode: false,
    }).then((resp) => {
      expect(resp.status).to.eq(403)
    })
  })

  it('should return 403 for non-admin user - hide card number', () => {
    setupStubs({
      role: 'view-only',
      allowMoto: true,
    })
    cy.request({
      url: baseUrl + '/moto-security/hide-card-number',
      failOnStatusCode: false,
    }).then((resp) => {
      expect(resp.status).to.eq(403)
    })
  })

  it('should return 403 for non-admin user - hide card security code', () => {
    setupStubs({
      role: 'view-only',
      allowMoto: true,
    })
    cy.request({
      url: baseUrl + '/moto-security/hide-card-security-code',
      failOnStatusCode: false,
    }).then((resp) => {
      expect(resp.status).to.eq(403)
    })
  })
})
