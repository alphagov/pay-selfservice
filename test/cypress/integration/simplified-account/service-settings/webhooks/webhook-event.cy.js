const userStubs = require('@test/cypress/stubs/user-stubs')
const ROLES = require('@test/fixtures/roles.fixtures')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const webhooksStubs = require('@test/cypress/stubs/webhooks-stubs')
const moment = require('moment-timezone')
const checkSettingsNavigation = require('@test/cypress/integration/simplified-account/service-settings/helpers/check-settings-nav')
const transactionFixtures = require('@test/fixtures/ledger-transaction.fixtures')

const USER_EXTERNAL_ID = 'user123abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const SERVICE_NAME = {
  en: 'McDuck Enterprises', cy: 'Mentrau McDuck'
}
const LIVE_ACCOUNT_TYPE = 'live'
const GATEWAY_ACCOUNT_ID = 10
const WEBHOOK_ID = 'webhook-id-1'
const WEBHOOK_DESCRIPTION = 'My first webhook'

const webhookEvent = {
  webhook_id: WEBHOOK_ID,
  external_id: 'webhook-event-id-1',
  event_date: '2025-02-25T11:30:48.015Z',
  resource_id: 'webhook-event-resource-id-1'
}

const WEBHOOK_BASE_URL = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/webhooks`
const WEBHOOK_DETAILS_URL = `${WEBHOOK_BASE_URL}/${WEBHOOK_ID}`
const WEBHOOK_EVENT_URL = `${WEBHOOK_DETAILS_URL}/event/${webhookEvent.external_id}`
const WEBHOOK_EVENT_RESOURCE_URL = `/account/a-valid-external-id/transactions/${webhookEvent.resource_id}`

const WEBHOOK_EVENT_RESOURCE = transactionFixtures.validTransactionDetailsResponse({ transaction_id: 'an-external-id' })

const attempts = [
  {
    created_date: '2025-02-26T12:36:54.050Z',
    send_at: '2025-02-28T12:36:54.050Z',
    status: 'SUCCESSFUL',
    response_time: 447,
    status_code: 200,
    result: '200 Success'
  },
  {
    created_date: '2025-02-25T12:36:52.819Z',
    send_at: '2025-02-26T12:36:52.819Z',
    status: 'FAILED',
    response_time: 473,
    status_code: 403,
    result: '403 Forbidden'
  },
  {
    created_date: '2025-02-25T11:36:51.857Z',
    send_at: '2025-02-25T12:36:51.857Z',
    status: 'FAILED',
    response_time: 490,
    status_code: 403,
    result: '403 Forbidden'
  }]

const statusTextMap = {
  PENDING: 'Pending Retry',
  SUCCESSFUL: 'Successful',
  FAILED: 'Failed',
  WILL_NOT_SEND: 'Will not send'
}

const setStubs = (opts = {}, additionalStubs = []) => {
  cy.task('setupStubs', [
    userStubs.getUserSuccess({
      userExternalId: USER_EXTERNAL_ID,
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      serviceName: SERVICE_NAME,
      serviceExternalId: SERVICE_EXTERNAL_ID,
      role: ROLES[opts.role || 'admin']
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
      description: WEBHOOK_DESCRIPTION,
      created_date: '2024-08-20T14:00:00.000Z',
      subscriptions: ['card_payment_captured', 'card_payment_succeeded']
    }),
    webhooksStubs.getWebhookMessage({
      ...webhookEvent
    }),
    webhooksStubs.getWebhookMessageAttempts({
      webhook_id: WEBHOOK_ID,
      message_id: webhookEvent.external_id,
      attempts
    }),
    ...additionalStubs])
}

describe('for an admin', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
    setStubs()
    cy.visit(WEBHOOK_EVENT_URL)
  })

  it('should show title and heading', () => {
    cy.title().should('eq', `Payment captured event details - ${WEBHOOK_DESCRIPTION} - Settings - ${SERVICE_NAME.en} - GOV.UK Pay`)
    cy.get('h1.govuk-heading-l').should('have.text', 'Payment captured')
  })

  it('should show event body in detail component', () => {
    cy.get('.govuk-details summary').should('contain.text', 'Payment captured event body').click()
    cy.get('.govuk-details div.govuk-details__text pre code').should('contain.text', JSON.stringify(WEBHOOK_EVENT_RESOURCE, null, 4))
  })

  it('should show active "Webhooks" link', () => {
    cy.visit(WEBHOOK_EVENT_URL)
    checkSettingsNavigation('Webhooks', `${WEBHOOK_BASE_URL}`)
  })

  it('should show summary list', () => {
    cy.get('.govuk-summary-list').should('have.length', 1)
    cy.get('.govuk-summary-list__row:eq(0) > dt').should('contain.text', 'GOV.UK payment ID')
    cy.get('.govuk-summary-list__row:eq(0) > dd').within(() => {
      cy.get('span')
        .should('have.attr', 'class', 'govuk-visually-hidden')
        .should('contain.text', 'GOV.UK payment ID')
      cy.get('a')
        .should('have.attr', 'href', WEBHOOK_EVENT_RESOURCE_URL)
        .should('contain.text', webhookEvent.resource_id)
    })
    cy.get('.govuk-summary-list__row:eq(1) > dt').should('contain.text', 'Event date')
    cy.get('.govuk-summary-list__row:eq(1) > dd').should('contain.text', '25 February 2025')
    cy.get('.govuk-summary-list__row:eq(2) > dt').should('contain.text', 'Status')
    cy.get('.govuk-summary-list__row:eq(2) > dd .govuk-tag').should('contain.text', 'Successful')
  })

  it('should show attempts list', () => {
    cy.get('.govuk-table').should('have.length', 1)
    cy.get('.govuk-table__header:eq(0)').should('contain', 'Attempt date')
    cy.get('.govuk-table__header:eq(1)').should('contain', 'Status')
    cy.get('.govuk-table__header:eq(2)').should('contain', 'Status code')
    cy.get('.govuk-table__header:eq(3)').should('contain', 'Result')

    attempts.forEach((attempt, i) => {
      cy.get(`tbody .govuk-table__row:eq(${i}) > td:eq(0)`).should('contain.text', formatDateTime(attempt.send_at))
      cy.get(`tbody .govuk-table__row:eq(${i}) > td:eq(1)`).should('contain.text', statusTextMap[attempt.status])
      cy.get(`tbody .govuk-table__row:eq(${i}) > td:eq(2)`).should('contain.text', attempt.status_code)
      cy.get(`tbody .govuk-table__row:eq(${i}) > td:eq(3)`).should('contain.text', attempt.result)
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
      url: WEBHOOK_EVENT_URL,
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(403)
    })
  })
})

function formatDateTime(isoTimeString) {
  return moment(isoTimeString).tz('Europe/London').format('D MMMM YYYY HH:mm')
}
