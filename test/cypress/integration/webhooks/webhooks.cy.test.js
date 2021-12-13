const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const webhooksStubs = require('../../stubs/webhooks-stubs')

const userExternalId = 'some-user-id'
const gatewayAccountId = 10
const gatewayAccountExternalId = 'gateway-account-id'
const serviceExternalId = 'service-id'
const webhookExternalId = 'webhook-id'

const userAndGatewayAccountStubs = [
  userStubs.getUserSuccess({ userExternalId, serviceExternalId, gatewayAccountId }),
  gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({ gatewayAccountId, gatewayAccountExternalId, serviceExternalId }),
  webhooksStubs.getWebhooksListSuccess({ service_id: serviceExternalId, live: false, webhooks: [{ external_id: webhookExternalId }] }),
  webhooksStubs.getWebhookSuccess({ service_id: serviceExternalId, external_id: webhookExternalId }),
  webhooksStubs.getWebhookSigningSecret({ service_id: serviceExternalId, external_id: webhookExternalId })
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

    cy.get('[data-webhook-entry]').should('have.length', 1)
  })

  it('should create a webhook with valid properties', () => {
    const callbackUrl = 'https://some-valid-callback-url.com'
    const description = 'A valid Webhook description'

    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs
    ])

    cy.get('[data-action=create').contains('Create a new Webhook').click()
    cy.get('#callback_url').type(callbackUrl)
    cy.get('#description').type(description)
    cy.get('[value=card_payment_captured]').click()

    cy.get('button').contains('Create Webhook').click()
  })

  it('should display a valid webhooks details', () => {
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs
    ])

    cy.get('[data-action=update]').then((links) => links[0].click())

    cy.get('h1').contains('https://some-callback-url.com')
    cy.get('.govuk-list.govuk-list--bullet > li').should('have.length', 1)
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

    cy.get('#callback_url').should('have.value', 'https://some-callback-url.com')
    cy.get('#description').should('have.value', 'a valid webhook description')
    cy.get('[value=card_payment_captured]').should('be.checked')

    cy.get('button').contains('Update Webhook').click()
  })

  it('should show a webhook signing secret', () => {
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs
    ])
    cy.get('#signing-secret').click()

    cy.get('h1').contains('Manage signing secret')

    cy.get('#secret').contains('valid-signing-secret')
  })
})
