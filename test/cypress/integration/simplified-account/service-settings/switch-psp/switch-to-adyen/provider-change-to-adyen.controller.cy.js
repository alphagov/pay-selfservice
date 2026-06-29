const checkSettingsNavigation = require('@test/cypress/integration/simplified-account/service-settings/helpers/check-settings-nav')
const userStubs = require('@test/cypress/stubs/user-stubs')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const { STRIPE, WORLDPAY } = require('@models/constants/payment-providers')
const ROLES = require('@test/fixtures/roles.fixtures')
const { STRIPE_CREDENTIAL_IN_ACTIVE_STATE } = require('@test/fixtures/credentials.fixtures')
const { GatewayAccountType } = require('@models/gateway-account/gateway-account-type')

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const SERVICE_NAME = {
  en: 'McDuck Enterprises',
  cy: 'Mentrau McDuck',
}
const LIVE_ACCOUNT_TYPE = 'live'
const GATEWAY_ACCOUNT_ID = 10

const PROVIDER_CHANGE_TO_ADYEN = `/service/${SERVICE_EXTERNAL_ID}/account/live/settings/switch-psp/switch-to-adyen/provider-change-to-adyen`

const setStubs = (opts = {}, additionalStubs = []) => {
  cy.task('setupStubs', [
    userStubs.getUserSuccess({
      userExternalId: USER_EXTERNAL_ID,
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      serviceName: SERVICE_NAME,
      serviceExternalId: SERVICE_EXTERNAL_ID,
      role: ROLES[opts.role || 'admin'],
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(
      SERVICE_EXTERNAL_ID,
      opts.gatewayAccountType || LIVE_ACCOUNT_TYPE,
      {
        gateway_account_id: GATEWAY_ACCOUNT_ID,
        type: opts.gatewayAccountType || GatewayAccountType.LIVE,
        payment_provider: opts.paymentProvider || STRIPE,
        provider_switch_enabled: opts.providerSwitchEnabled || false,
        gateway_account_credentials: [STRIPE_CREDENTIAL_IN_ACTIVE_STATE],
      }
    ),
    ...additionalStubs,
  ])
}

describe('Switch to Adyen info', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })
  describe('Your provider is changing to Adyen page', () => {
    describe('Stripe live account', () => {
      it('should show Your provider is changing page to admin user', () => {
        setStubs({
          role: 'admin',
        })
        cy.visit(PROVIDER_CHANGE_TO_ADYEN, { failOnStatusCode: false })
        cy.title().should('contain', 'Your provider is changing to Adyen')

        const PROVIDER_CHANGE_TO_ADYEN_URL = `/service/${SERVICE_EXTERNAL_ID}/account/live/settings/switch-psp/switch-to-adyen/provider-change-to-adyen`
        checkSettingsNavigation('Your provider is changing to Adyen', PROVIDER_CHANGE_TO_ADYEN_URL)
      })
      it('should show error page to non-admin user', () => {
        setStubs({
          role: 'view-and-refund',
        })
        cy.visit(PROVIDER_CHANGE_TO_ADYEN, { failOnStatusCode: false })
        cy.title().should('eq', 'An error occurred - GOV.UK Pay')
        cy.get('h1').should('contain.text', 'An error occurred')
      })
    })
    describe('Stripe test account', () => {
      it('should show page not found error to admin user', () => {
        setStubs({
          role: 'admin',
          gatewayAccountType: GatewayAccountType.TEST,
        })
        cy.visit(PROVIDER_CHANGE_TO_ADYEN, { failOnStatusCode: false })
        cy.title().should('contain', 'Page not found')
      })
      it('should show page not found error to non-admin user', () => {
        setStubs({
          role: 'view-and-refund',
          gatewayAccountType: GatewayAccountType.TEST,
        })
        cy.visit(PROVIDER_CHANGE_TO_ADYEN, { failOnStatusCode: false })
        cy.title().should('eq', 'Page not found - GOV.UK Pay')
        cy.get('h1').should('contain.text', 'Page not found')
      })
    })
    describe('Worldpay live account', () => {
      it('should show error page to admin user', () => {
        setStubs({
          role: 'admin',
          paymentProvider: WORLDPAY,
        })
        cy.visit(PROVIDER_CHANGE_TO_ADYEN, { failOnStatusCode: false })
        cy.title().should('eq', 'Page not found - GOV.UK Pay')
        cy.get('h1').should('contain.text', 'Page not found')
      })
    })
  })
})
