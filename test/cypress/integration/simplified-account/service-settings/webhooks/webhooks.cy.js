const userStubs = require('@test/cypress/stubs/user-stubs')
const ROLES = require('@test/fixtures/roles.fixtures')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const { getWebhooksListSuccess } = require('@test/cypress/stubs/webhooks-stubs')

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service-456-def'
const SERVICE_NAME = {
  en: 'McDuck Enterprises', cy: 'Mentrau McDuck'
}
const LIVE_ACCOUNT_TYPE = 'live'
const GATEWAY_ACCOUNT_ID = 10
const WEBHOOKS_SETTINGS_URL = `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/webhooks`

const EXISTING_WEBHOOKS = [
  {
    external_id: 'webhook-id-1',
    callback_url: 'https://www.callback.gov.uk',
    description: 'My first webhook',
    subscriptions: ['card_payment_succeeded', 'card_payment_captured'],
    status: 'ACTIVE'
  },
  {
    external_id: 'webhook-id-2',
    callback_url: 'https://www.another-callback.gov.uk',
    description: 'My second webhook',
    subscriptions: ['card_payment_failed'],
    status: 'ACTIVE'
  },
  {
    external_id: 'webhook-id-3',
    callback_url: 'https://www.inactive-callback.gov.uk',
    description: 'My third webhook',
    subscriptions: ['card_payment_succeeded', 'card_payment_captured'],
    status: 'INACTIVE'
  }
]

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
    ...additionalStubs])
}

describe('for an admin', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
    setStubs({}, [
      getWebhooksListSuccess({ service_id: SERVICE_EXTERNAL_ID, gateway_account_id: GATEWAY_ACCOUNT_ID, live: true, webhooks: EXISTING_WEBHOOKS })
    ])
    cy.visit(WEBHOOKS_SETTINGS_URL)
  })

  it('should show webhooks in the setting navigation', () => {
    cy.get('.service-settings-nav')
      .find('li')
      .contains('Webhooks')
      .then(li => {
        cy.wrap(li)
          .should('have.attr', 'href', WEBHOOKS_SETTINGS_URL)
          .parent().should('have.class', 'service-settings-nav__li--active')
      })
  })

  it('should show title, heading and create Webhook button', () => {
    cy.title().should('eq', 'Webhooks - Settings - McDuck Enterprises - GOV.UK Pay')
    cy.get('h1').should('have.text', 'Webhooks')
    cy.get('div.service-settings-pane')
      .find('a')
      .contains('Create a new webhook')
      .should('have.attr', 'href', `${WEBHOOKS_SETTINGS_URL}/create`)
  })

  it('should show webhooks as summary cards', () => {
    cy.get('div.govuk-summary-card').should('have.length', 3)
    cy.get('div.govuk-summary-card').first().find('h2').first()
      .should('contain.text', 'My first webhook')
      .get('strong.govuk-tag--blue')
      .should('contain.text', 'Active')
    cy.get('div.govuk-summary-card').first().find('a').first()
      .should('contain.text', 'View')
    cy.get('div.govuk-summary-card').first().find('a').eq(1)
      .should('contain.text', 'Update')
    cy.get('div.govuk-summary-card').first().find('dd').first()
      .should('contain.text', 'https://www.callback.gov.uk')
    cy.get('div.govuk-summary-card').first().find('dd').eq(1)
      .should('contain.text', 'Payment succeeded')
    cy.get('div.govuk-summary-card').first().find('dd').eq(1)
      .should('contain.text', 'Payment captured')

    cy.get('div.govuk-summary-card').eq(1).find('h2').first()
      .should('contain.text', 'My second webhook')
      .get('strong.govuk-tag--blue')
      .should('contain.text', 'Active')
    cy.get('div.govuk-summary-card').eq(1).find('a').first()
      .should('contain.text', 'View')
    cy.get('div.govuk-summary-card').eq(1).find('a').eq(1)
      .should('contain.text', 'Update')
    cy.get('div.govuk-summary-card').eq(1).find('dd').first()
      .should('contain.text', 'https://www.another-callback.gov.uk')
    cy.get('div.govuk-summary-card').eq(1).find('dd').eq(1)
      .should('contain.text', 'Payment failed')

    cy.get('div.govuk-summary-card').eq(2).find('h2').first()
      .should('contain.text', 'My third webhook')
      .get('strong.govuk-tag--yellow')
      .should('contain.text', 'Inactive')
    cy.get('div.govuk-summary-card').eq(2).find('a').first()
      .should('contain.text', 'View')
    cy.get('div.govuk-summary-card').eq(2).find('a').eq(1)
      .should('contain.text', 'Update')
    cy.get('div.govuk-summary-card').eq(2).find('dd').first()
      .should('contain.text', 'https://www.inactive-callback.gov.uk')
    cy.get('div.govuk-summary-card').eq(2).find('dd').eq(1)
      .should('contain.text', 'Payment succeeded')
    cy.get('div.govuk-summary-card').eq(2).find('dd').eq(1)
      .should('contain.text', 'Payment captured')
  })
})

describe('for a non-admin user', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
    setStubs({ role: 'view-only' })
  })

  it('should return forbidden when visiting the url directly', () => {
    cy.request({
      url: WEBHOOKS_SETTINGS_URL,
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(403)
    })
  })

  it('should not show webhooks link in the navigation panel', () => {
    cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/`)
    cy.get('#webhooks').should('not.exist')
  })

  it('should return forbidden when visiting the create webhook url directly', () => {
    cy.request({
      url: WEBHOOKS_SETTINGS_URL + '/create',
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(403)
    })
  })
})
