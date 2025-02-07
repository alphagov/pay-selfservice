const userStubs = require('@test/cypress/stubs/user-stubs')
const ROLES = require('@test/fixtures/roles.fixtures')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const { STRIPE } = require('@models/constants/payment-providers')
const stripeAccountSetupStubs = require('@test/cypress/stubs/stripe-account-setup-stub')
const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service-456-def'
const SERVICE_NAME = {
  en: 'McDuck Enterprises', cy: 'Mentrau McDuck'
}
const LIVE_ACCOUNT_TYPE = 'live'
const GATEWAY_ACCOUNT_ID = 10

const SWITCH_TO_WORLDPAY_SETTINGS_URL = `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/switch-psp/switch-to-worldpay`

const setStubs = (opts = {}, additionalStubs = []) => {
  cy.task('setupStubs', [
    userStubs.getUserSuccess({
      userExternalId: USER_EXTERNAL_ID,
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      serviceName: SERVICE_NAME,
      serviceExternalId: SERVICE_EXTERNAL_ID,
      role: ROLES[opts.role || 'admin'],
      features: 'degatewayaccountification' // TODO remove features once simplified accounts are live
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE, {
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      type: LIVE_ACCOUNT_TYPE,
      payment_provider: STRIPE,
      provider_switch_enabled: true
    }),
    stripeAccountSetupStubs.getStripeSetupProgressByServiceExternalIdAndAccountType({
      serviceExternalId: SERVICE_EXTERNAL_ID,
      accountType: LIVE_ACCOUNT_TYPE,
      bankAccount: true,
      responsiblePerson: true,
      director: true,
      vatNumber: true,
      companyNumber: true,
      organisationDetails: true,
      governmentEntityDocument: true
    }),
    ...additionalStubs])
}

describe('Switch to Worldpay setting', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })
  describe('For a non-admin', () => {
    beforeEach(() => {
      setStubs({
        role: 'view-and-refund'
      }, [])
      cy.visit(SWITCH_TO_WORLDPAY_SETTINGS_URL, { failOnStatusCode: false })
    })
    it('should show admin only error', () => {
      cy.title().should('eq', 'An error occurred - GOV.UK Pay')
      cy.get('h1').should('contain.text', 'An error occurred')
      cy.get('#errorMsg').should('contain.text', 'You do not have the administrator rights to perform this operation.')
    })
  })

  describe('For an admin', () => {
    beforeEach(() => {
      setStubs()
      cy.visit(SWITCH_TO_WORLDPAY_SETTINGS_URL)
    })
    describe('the settings nav', () => {
      checkSettingsNavigation()
    })
    describe('the page', () => {
      checkTitleAndHeading()
    })
  })
})

function checkTitleAndHeading () {
  it('should have the correct title and heading', () => {
    cy.title().should('eq', 'Switch to Worldpay - Settings - McDuck Enterprises - GOV.UK Pay')
    cy.get('h1').should('have.text', 'Switch to Worldpay')
  })
}

function checkSettingsNavigation () {
  it('should show active switch to worldpay link', () => {
    cy.get('.service-settings-nav')
      .find('li')
      .contains('Switch to Worldpay')
      .then(li => {
        cy.wrap(li)
          .should('have.attr', 'href', SWITCH_TO_WORLDPAY_SETTINGS_URL)
          .parent().should('have.class', 'service-settings-nav__li--active')
      })
  })
}
