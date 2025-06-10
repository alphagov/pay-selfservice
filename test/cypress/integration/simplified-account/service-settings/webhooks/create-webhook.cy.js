const checkSettingsNavigation = require('@test/cypress/integration/simplified-account/service-settings/helpers/check-settings-nav')
const userStubs = require('@test/cypress/stubs/user-stubs')
const ROLES = require('@test/fixtures/roles.fixtures')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const {
  getWebhooksListSuccess,
  createWebhookViolatesBackend,
  postCreateWebhookSuccess,
} = require('@test/cypress/stubs/webhooks-stubs')

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const SERVICE_NAME = {
  en: 'McDuck Enterprises',
  cy: 'Mentrau McDuck',
}
const LIVE_ACCOUNT_TYPE = 'live'
const GATEWAY_ACCOUNT_ID = 10
const WEBHOOKS_SETTINGS_URL = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/webhooks`
const VALID_DESCRIPTION = 'My new webhook'
const VALID_CALLBACK_URL = 'https://www.callback.gov.uk'

const setStubs = (opts = {}, additionalStubs = []) => {
  cy.task('setupStubs', [
    userStubs.getUserSuccess({
      userExternalId: USER_EXTERNAL_ID,
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      serviceName: SERVICE_NAME,
      serviceExternalId: SERVICE_EXTERNAL_ID,
      role: ROLES[opts.role || 'admin'],
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE, {
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      type: LIVE_ACCOUNT_TYPE,
      provider_switch_enabled: opts.providerSwitchEnabled || false,
    }),
    ...additionalStubs,
  ])
}

describe('for an admin', () => {
  describe('success', () => {
    beforeEach(() => {
      cy.setEncryptedCookies(USER_EXTERNAL_ID)
      setStubs({}, [
        getWebhooksListSuccess({
          service_id: SERVICE_EXTERNAL_ID,
          gateway_account_id: GATEWAY_ACCOUNT_ID,
          live: true,
          webhooks: [],
        }),
        postCreateWebhookSuccess(),
      ])
      cy.visit(WEBHOOKS_SETTINGS_URL)
      cy.get('div.service-pane').find('a').contains('Create a new webhook').click()
    })

    it('should show active "Webhooks" link in the setting navigation', () => {
      checkSettingsNavigation('Webhooks', WEBHOOKS_SETTINGS_URL)
    })

    it('should show title and heading', () => {
      cy.title().should('eq', 'Webhook details - Settings - McDuck Enterprises - GOV.UK Pay')
      cy.get('h1').should('have.text', 'Webhook details')
    })

    it('should create a webhook with valid properties', () => {
      cy.get('input[type="text"][name="description"]').type(VALID_DESCRIPTION)
      cy.get('input[type="url"][name="callbackUrl"]').type(VALID_CALLBACK_URL)
      cy.get('input[type="checkbox"][value="card_payment_succeeded"]').check()
      cy.get('button[type="submit"]').contains('Save').click()
      cy.title().should('eq', 'Webhooks - Settings - McDuck Enterprises - GOV.UK Pay')
      cy.get('h1').should('contain', 'Webhooks')
      cy.location('pathname').should('eq', WEBHOOKS_SETTINGS_URL)
      cy.get('.govuk-error-summary').should('not.exist')
    })
  })

  describe('failure', () => {
    beforeEach(() => {
      cy.setEncryptedCookies(USER_EXTERNAL_ID)
      setStubs({}, [
        getWebhooksListSuccess({
          service_id: SERVICE_EXTERNAL_ID,
          gateway_account_id: GATEWAY_ACCOUNT_ID,
          live: true,
          webhooks: [],
        }),
        createWebhookViolatesBackend(),
      ])
      cy.visit(WEBHOOKS_SETTINGS_URL + '/create')
    })

    it('should show errors for missing fields', () => {
      cy.get('.govuk-error-summary').should('not.exist')
      cy.get('button[type="submit"]').contains('Save').click()
      cy.get('.govuk-error-summary')
        .should('exist')
        .should('contain', 'Enter a description')
        .should('contain', 'Enter a callback url')
        .should('contain', 'Select at least one payment event')
      cy.get('input[type="text"][name="description"]').should('have.class', 'govuk-input--error')
      cy.get('#description-error').should('contain.text', 'Enter a description')
      cy.get('input[type="url"][name="callbackUrl"]').should('have.class', 'govuk-input--error')
      cy.get('#callback-url-error').should('contain.text', 'Enter a callback url')
      cy.get('.govuk-fieldset').should('contain.text', 'Select at least one payment event')
    })

    it('should show errors for callback url with domain not approved', () => {
      cy.get('.govuk-error-summary').should('not.exist')
      cy.get('input[type="text"][name="description"]').type(VALID_DESCRIPTION)
      cy.get('input[type="url"][name="callbackUrl"]').type('https://www.not-an-approved-domain.com')
      cy.get('input[type="checkbox"][value="card_payment_succeeded"]').check()
      cy.get('button[type="submit"]').contains('Save').click()
      cy.get('.govuk-error-summary')
        .should('exist')
        .should('contain', 'Callback URL must be approved. Please contact support')
      cy.get('input[type="url"][name="callbackUrl"]').should('have.class', 'govuk-input--error')
      cy.get('#callback-url-error').should('contain.text', 'Callback URL must be approved. Please contact support')
    })
  })
})

describe('for a non-admin user', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
    setStubs({ role: 'view-only' })
  })

  it('should return forbidden when visiting the url directly', () => {
    cy.request({
      url: WEBHOOKS_SETTINGS_URL + '/create',
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
    })
  })

  it('should not show webhooks link in the navigation panel', () => {
    cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/`)
    cy.get('#webhooks').should('not.exist')
  })
})
