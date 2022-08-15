const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const webhooksStubs = require('../../stubs/webhooks-stubs')

const userExternalId = 'some-user-id'
const gatewayAccountId = 10
const gatewayAccountExternalId = 'gateway-account-id'
const serviceExternalId = 'service-id'
const webhookExternalId = 'webhook-id'
const messageExternalId = 'message-id'

const userAndGatewayAccountStubs = [
  userStubs.getUserSuccess({ userExternalId, serviceExternalId, gatewayAccountId }),
  gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({ gatewayAccountId, gatewayAccountExternalId, serviceExternalId }),
  webhooksStubs.getWebhooksListSuccess({ service_id: serviceExternalId, live: false, webhooks: [{ external_id: webhookExternalId }, { status: 'INACTIVE' }, { status: 'DISABLED' }] }),
  webhooksStubs.getWebhookSuccess({ service_id: serviceExternalId, external_id: webhookExternalId, subscriptions: [ 'card_payment_captured', 'card_payment_succeeded', 'card_payment_refunded' ] }),
  webhooksStubs.getWebhookMessagesListSuccess({ service_id: serviceExternalId,
    external_id: webhookExternalId,
    messages: [
      { latest_attempt: { status: 'PENDING' }, external_id: messageExternalId },
      { latest_attempt: { status: 'FAILED' } },
      { latest_attempt: { status: 'WILL_NOT_SEND' } },
      { latest_attempt: { status: 'SUCCESSFUL' } },
      { latest_attempt: { status: 'SUCCESSFUL' } },
      { latest_attempt: { status: 'SUCCESSFUL' } },
      { latest_attempt: { status: 'SUCCESSFUL' } },
      { latest_attempt: { status: 'SUCCESSFUL' } },
      { latest_attempt: { status: 'SUCCESSFUL' } },
      { latest_attempt: { status: 'SUCCESSFUL' } },
      { latest_attempt: { status: 'SUCCESSFUL' } }
    ] }),
  webhooksStubs.getWebhookSigningSecret({ service_id: serviceExternalId, external_id: webhookExternalId }),
  webhooksStubs.getWebhookMessage({ external_id: messageExternalId, webhook_id: webhookExternalId }),
  webhooksStubs.getWebhookMessageAttempts({ message_id: messageExternalId, webhook_id: webhookExternalId, attempts: [ {} ] })
]

describe('Webhooks', () => {
  beforeEach(() => {
    Cypress.Cookies.preserveOnce('session', 'gateway_account')
  })

  it('should correctly list webhooks for a given service', () => {
    cy.setEncryptedCookies(userExternalId)
    cy.task('setupStubs', [ ...userAndGatewayAccountStubs ])
    cy.visit('/test/service/service-id/account/gateway-account-id/webhooks')

    cy.get('h1').should('have.text', 'Webhooks')

    // navigation menus are correctly integrated
    cy.get('#navigation-menu-settings').parent().should('have.class', 'service-navigation--list-item-active')
    cy.get('#navigation-menu-webhooks').parent().should('have.class', 'govuk-!-margin-bottom-2')

    cy.get('[data-webhook-entry]').should('have.length', 3)
  })

  it('should correctly display simple data consistency properties when creating', () => {
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs
    ])

    cy.visit('/test/service/service-id/account/gateway-account-id/webhooks')
    cy.get('[data-action=create').contains('Create a new webhook').click()

    // no data has been provided
    cy.get('button').contains('Create webhook').click()

    cy.get('.govuk-error-summary').should('be.visible')
    cy.get('.govuk-error-summary__list').children().should('have.length', 2)
    cy.get('#callback_url-error').should('be.visible')
    cy.get('#subscriptions-error').should('be.visible')
  })

  it('should correctly display backend validated error identifiers', () => {
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      webhooksStubs.createWebhookViolatesBackend()
    ])

    const callbackUrl = 'https://some-valid-callback-url.test'
    const description = 'A valid Webhook description'

    cy.visit('/test/service/service-id/account/gateway-account-id/webhooks')
    cy.get('[data-action=create').contains('Create a new webhook').click()
    cy.get('#callback_url').type(callbackUrl)
    cy.get('#description').type(description)
    cy.get('[value=card_payment_captured]').click()
    cy.get('button').contains('Create webhook').click()

    cy.get('.govuk-error-summary').should('be.visible')
    cy.get('.govuk-error-summary__list').children().should('have.length', 1)
    cy.get('#callback_url-error').should('be.visible')
  })

  it('should create a webhook with valid properties', () => {
    const callbackUrl = 'https://some-valid-callback-url.test'
    const description = 'A valid Webhook description'

    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs
    ])

    cy.visit('/test/service/service-id/account/gateway-account-id/webhooks')
    cy.get('[data-action=create').contains('Create a new webhook').click()
    cy.get('#callback_url').type(callbackUrl)
    cy.get('#description').type(description)
    cy.get('[value=card_payment_captured]').click()
    cy.get('button').contains('Create webhook').click()
  })

  it('should display a valid webhooks details', () => {
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      webhooksStubs.getWebhookMessagesListSuccess({ service_id: serviceExternalId, external_id: webhookExternalId, messages: [{ status: 'FAILED' }], status: 'failed' })
    ])

    cy.get('[data-action=update]').then((links) => links[0].click())

    cy.get('h1').contains('https://some-callback-url.test')
    cy.get('.govuk-list.govuk-list--bullet > li').should('have.length', 3)

    // based on number of rows stubbed and client pagination logic
    cy.get('.govuk-table__body > .govuk-table__row').should('have.length', 11)
    cy.get('.paginationForm').should('have.length', 3)

    cy.get('a#filter-failed').click()
    cy.get('a#filter-failed').should('have.class', 'govuk-!-font-weight-bold')
  })

  it('should update a webhook with valid properties', () => {
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs
    ])
    cy.visit('/test/service/service-id/account/gateway-account-id/webhooks')

    // link to detail page
    cy.get('[data-action=update]').then((links) => links[0].click())

    // button through to update webhooks
    cy.get('[data-action=update]').click()

    cy.get('#callback_url').should('have.value', 'https://some-callback-url.test')
    cy.get('#description').should('have.value', 'a valid webhook description')
    cy.get('[value=card_payment_captured]').should('be.checked')

    cy.get('button').contains('Update webhook').click()
  })

  it('should show a webhook signing secret', () => {
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs
    ])
    cy.get('#signing-secret').click()

    cy.get('h1').contains('Manage signing secret')

    cy.get('#secret').contains('valid-signing-secret')
  })

  it('should toggle a webhook status', () => {
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs
    ])
    cy.visit('/test/service/service-id/account/gateway-account-id/webhooks')
    cy.get('[data-action=update]').then((links) => links[0].click())
    cy.get('#toggle-status').click()

    cy.get('h1').contains('Deactivate webhook')

    cy.get('#toggle-active-webhook').click()
    cy.get('.govuk-notification-banner__heading').contains('Webhook status updated')
  })

  it('should browse to event detail page', () => {
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs
    ])
    cy.get('[data-action=detail]').then((links) => links[0].click())
    cy.get('h1').contains('Payment captured')
  })

  /* re-introduce when backend POST route enabled */
  /* it('should schedule a webhook message for retry', () => {
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs
    ])
    cy.get('[data-action=resend]').click()
    cy.get('.govuk-notification-banner__heading').contains('Webhook message scheduled for retry')
  }) */
})
