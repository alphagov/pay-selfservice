const userStubs = require('@test/cypress/stubs/user-stubs')
const ROLES = require('@test/fixtures/roles.fixtures')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const webhooksStubs = require('@test/cypress/stubs/webhooks-stubs')

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service-456-def'
const SERVICE_NAME = {
  en: 'McDuck Enterprises', cy: 'Mentrau McDuck'
}
const LIVE_ACCOUNT_TYPE = 'live'
const GATEWAY_ACCOUNT_ID = 10
const WEBHOOK_ID = 'webhook-id-1'
const WEBHOOK_DETAILS_URL = `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/webhooks/${WEBHOOK_ID}`

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
      provider_switch_enabled: opts.providerSwitchEnabled || false
    }),
    webhooksStubs.getWebhookSuccess({
      service_id: SERVICE_EXTERNAL_ID,
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      external_id: WEBHOOK_ID,
      callback_url: 'https://www.callback-url.gov.uk',
      description: 'My first webhook',
      created_date: '2024-08-20T14:00:00.000Z',
      subscriptions: ['card_payment_captured', 'card_payment_succeeded']
    }),
    webhooksStubs.getWebhookSigningSecret({
      service_id: SERVICE_EXTERNAL_ID,
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      external_id: WEBHOOK_ID,
      signing_key: '123-signing-secret-456'
    }),
    webhooksStubs.getWebhookMessagesListSuccess({
      external_id: WEBHOOK_ID
    }),
    ...additionalStubs])
}

describe('for an admin', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
    setStubs()
    cy.visit(WEBHOOK_DETAILS_URL)
  })

  it('should show title and heading', () => {
    cy.title().should('eq', 'My first webhook - Settings - McDuck Enterprises - GOV.UK Pay')
    cy.get('div.webhook-header-with-tag').find('h1').should('have.text', 'My first webhook')
    cy.get('div.webhook-header-with-tag').find('.govuk-tag--blue').should('have.text', 'Active')
  })

  it('should show summary list, update button and deactivate button', () => {
    cy.get('.govuk-summary-list').should('have.length', 1)
    cy.get('.govuk-summary-list').find('dt').first().should('contain.text', 'Callback URL')
    cy.get('.govuk-summary-list').find('dd').first().should('contain.text', 'https://www.callback-url.gov.uk')
    cy.get('.govuk-summary-list').find('dt').eq(1).should('contain.text', 'Payment events sent by this webhook')
    cy.get('.govuk-summary-list').find('dd').eq(1).should('contain.text', 'Payment captured')
    cy.get('.govuk-summary-list').find('dd').eq(1).should('contain.text', 'Payment succeeded')
    cy.get('.govuk-summary-list').find('dt').eq(2).should('contain.text', 'Date created')
    cy.get('.govuk-summary-list').find('dd').eq(2).should('contain.text', '20 August 2024')
    cy.get('div.service-settings-pane')
      .find('a')
      .contains('Update webhook')
      .should('exist')
    cy.get('div.service-settings-pane')
      .find('a')
      .contains('Deactivate webhook')
      .should('exist')
  })

  it('should show signing secret and copy button', () => {
    cy.get('#signing-secret')
      .should('contain.text', '123-signing-secret-456')
      .should('have.class', 'copy-target')
    cy.get('#copy-signing-secret')
      .should('contain.text', 'Copy signing secret to clipboard')
      .should('have.attr', 'data-copy-text', 'true')
      .should('have.attr', 'data-target', 'copy-target')
      .click()
    cy.get('#copy-signing-secret')
      .should('contain.text', 'Signing secret copied')
  })
})

describe('for a non-admin user', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
    setStubs({ role: 'view-only' })
  })

  it('should return forbidden when visiting the url directly', () => {
    cy.request({
      url: WEBHOOK_DETAILS_URL,
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(403)
    })
  })
})
