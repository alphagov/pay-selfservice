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
const WEBHOOK_EXTERNAL_ID = 'webhook-123'
const CALLBACK_URL = 'https://www.callback.gov.uk'
const DESCRIPTION = 'My first webhook'
const SUBSCRIPTIONS = ['card_payment_succeeded', 'card_payment_captured']

const WEBHOOKS_SETTINGS_URL = `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/webhooks`

const EXISTING_WEBHOOKS = [
  {
    external_id: WEBHOOK_EXTERNAL_ID,
    callback_url: CALLBACK_URL,
    description: DESCRIPTION,
    subscriptions: SUBSCRIPTIONS,
    status: 'ACTIVE'
  },
  {
    status: 'ACTIVE'
  },
  {
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
  describe('the settings nav', () => {
    checkSettingsNavigation()
  })
  describe('the page', () => {
    checkTitleAndHeading()
    it.only('should show webhooks as summary cards', () => {
      cy.get('div.govuk-summary-card').should('have.length', 3)
      cy.get('div.govuk-summary-card').first().find('h2').first().contains(DESCRIPTION).get('strong.govuk-tag--blue').contains('Active')
      cy.get('div.govuk-summary-card').first().find('a').first().contains('View')
      cy.get('div.govuk-summary-card').first().find('a').eq(1).contains('Update')
      cy.get('div.govuk-summary-card').first().find('dd').first().contains(CALLBACK_URL)
      cy.get('div.govuk-summary-card').first().find('dd').eq(1).contains('Payment succeeded')
      cy.get('div.govuk-summary-card').first().find('dd').eq(1).contains('Payment captured')
      cy.get('div.govuk-summary-card').eq(1).find('h2').first().get('strong.govuk-tag--blue').contains('Active')
      cy.get('div.govuk-summary-card').eq(2).find('h2').first().get('strong.govuk-tag--yellow').contains('Inactive')
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

function checkTitleAndHeading () {
  it('should have the correct title and heading', () => {
    cy.title().should('eq', 'Webhooks - Settings - McDuck Enterprises - GOV.UK Pay')
    cy.get('h1').should('have.text', 'Webhooks')
  })
}

function checkSettingsNavigation () {
  it('should show active webhooks link', () => {
    cy.get('.service-settings-nav')
      .find('li')
      .contains('Webhooks')
      .then(li => {
        cy.wrap(li)
          .should('have.attr', 'href', WEBHOOKS_SETTINGS_URL)
          .parent().should('have.class', 'service-settings-nav__li--active')
      })
  })
}
