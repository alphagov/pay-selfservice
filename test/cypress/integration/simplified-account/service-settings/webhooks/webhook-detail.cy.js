const userStubs = require('@test/cypress/stubs/user-stubs')
const ROLES = require('@test/fixtures/roles.fixtures')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const webhooksStubs = require('@test/cypress/stubs/webhooks-stubs')
const moment = require('moment-timezone')

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const SERVICE_NAME = {
  en: 'McDuck Enterprises', cy: 'Mentrau McDuck'
}
const LIVE_ACCOUNT_TYPE = 'live'
const GATEWAY_ACCOUNT_ID = 10
const WEBHOOK_ID = 'webhook123abc'
const WEBHOOK_DETAILS_URL = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/webhooks/${WEBHOOK_ID}`

const statusTextMap = {
  PENDING: 'Pending retry',
  SUCCESSFUL: 'Successful',
  FAILED: 'Failed',
  WILL_NOT_SEND: 'Will not send'
}

const humanReadableSubscriptions = {
  card_payment_succeeded: 'Payment succeeded',
  card_payment_failed: 'Payment failed',
  card_payment_expired: 'Payment expired',
  card_payment_captured: 'Payment captured',
  card_payment_refunded: 'Payment refunded'
}

const messages = [
  {
    external_id: 'event123abc',
    created_date: '2025-02-25T11:30:49.295Z',
    event_date: '2025-02-25T11:30:48.015Z',
    event_type: 'card_payment_captured',
    resource_id: 'payment123abc',
    resource_type: 'PAYMENT',
    last_delivery_status: 'SUCCESSFUL'
  },
  {
    external_id: 'event456def',
    created_date: '2025-02-24T11:30:46.199Z',
    event_date: '2025-02-24T11:30:45.969Z',
    event_type: 'card_payment_succeeded',
    resource_id: 'payment456def',
    resource_type: 'PAYMENT',
    last_delivery_status: 'PENDING'
  },
  {
    external_id: 'event789ghi',
    created_date: '2025-02-23T11:30:14.670Z',
    event_date: '2025-02-23T11:30:13.376Z',
    event_type: 'card_payment_captured',
    resource_id: 'payment789ghi',
    resource_type: 'PAYMENT',
    last_delivery_status: 'FAILED'
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
      external_id: WEBHOOK_ID,
      total: messages.length,
      messages
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
    cy.get('div.header-with-tag').find('h1').should('have.text', 'My first webhook')
    cy.get('div.header-with-tag').find('.govuk-tag--blue').should('have.text', 'Active')
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
    cy.get('h3#app-subnav-heading.govuk-visually-hidden')
      .should('be.visible')
      .and('have.text', 'My first webhook signing secret ')
    cy.get('#copy-signing-secret')
      .should('contain.text', 'Copy signing secret to clipboard')
      .should('have.attr', 'data-copy-text', 'true')
      .should('have.attr', 'data-target', 'copy-target')
      .click()
    cy.get('#copy-signing-secret')
      .should('contain.text', 'Signing secret copied')
  })

  it('should show events', () => {
    cy.get('.govuk-table').should('have.length', 1)
    cy.get('.govuk-table__header:eq(0)').should('contain', 'GOV.UK payment ID')
    cy.get('.govuk-table__header:eq(1)').should('contain', 'Event name')
    cy.get('.govuk-table__header:eq(2)').should('contain', 'Delivery status')
    cy.get('.govuk-table__header:eq(3)').should('contain', 'Event date')

    messages.forEach((message, i) => {
      cy.get(`tbody .govuk-table__row:eq(${i}) > td:eq(0)`).should('contain.text', message.resource_id)
      cy.get(`tbody .govuk-table__row:eq(${i}) > td:eq(1)`)
        .should('contain.text', humanReadableSubscriptions[message.event_type])
        .find('a')
        .should('have.attr', 'href', `${WEBHOOK_DETAILS_URL}/event/${message.external_id}`)
        .should('contain.text', 'View details')
      cy.get(`tbody .govuk-table__row:eq(${i}) > td:eq(2)`).should('contain.text', statusTextMap[message.last_delivery_status])
      cy.get(`tbody .govuk-table__row:eq(${i}) > td:eq(3)`).should('contain.text', formatDateTime(message.event_date))
    })

    cy.get('[data-cy="pagination-detail"]').should('contain', 'Showing 1 to 3 of 3 events')
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

function formatDateTime (isoTimeString) {
  return moment(isoTimeString).tz('Europe/London').format('D MMMM YYYY HH:mm')
}
