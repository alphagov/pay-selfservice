const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const tokenStubs = require('../../stubs/token-stubs')

const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e' // pragma: allowlist secret
const gatewayAccountId = 42
const gatewayAccountExternalId = 'a-valid-external-id'
const serviceName = 'My Awesome Service'

function setupStubs (disabled) {
  cy.task('setupStubs', [
    userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceName }),
    tokenStubs.getTokensForAccountSuccess(gatewayAccountId),
    gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
      gatewayAccountId,
      gatewayAccountExternalId,
      paymentProvider: 'worldpay',
      disabled
    })
  ])
}

describe('API keys', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId)
  })

  it('should show API keys link for an account that is not disabled', () => {
    setupStubs(false)
    cy.visit(`/account/${gatewayAccountExternalId}/settings`)
    cy.location('pathname').should('eq', `/account/${gatewayAccountExternalId}/settings`)
    cy.get('#navigation-menu-api-keys').should('contain', 'API keys').click()
    cy.location('pathname').should('eq', `/account/${gatewayAccountExternalId}/api-keys`)
    cy.get('.govuk-heading-l').should('have.text', 'API Keys')
    cy.get('#active-tokens').should('contain.text', 'There is 1 active API key')
    cy.get('#create-api-key').should('exist')
    cy.get('.key-list').within(() => {
      cy.get('.govuk-heading-s').should('have.text', 'my-token-description')
    })
  })

  it('should not show API keys link for an account that is disabled', () => {
    setupStubs(true)
    cy.visit(`/account/${gatewayAccountExternalId}/settings`)
    cy.get('#navigation-menu-api-keys').should('not.exist')
  })
})
