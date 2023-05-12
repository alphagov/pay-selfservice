const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')

const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
const gatewayAccountId = 42
const gatewayAccountExternalId = 'a-valid-external-id'
const serviceName = 'My Awesome Service'
const credentialId = 1

function setupStubs (allowGooglePay) {
  cy.task('setupStubs', [
    userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceName }),
    gatewayAccountStubs.patchUpdateCredentialsSuccess(gatewayAccountId, credentialId),
    gatewayAccountStubs.patchAccountUpdateGooglePaySuccess(gatewayAccountId, true),
    gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
      gatewayAccountId,
      gatewayAccountExternalId,
      paymentProvider: 'worldpay',
      allowGooglePay,
      gatewayAccountCredentials: [{
        payment_provider: 'worldpay'
      }]
    })
  ])
}

describe('Google Pay', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId)
  })

  it('should show it is disabled', () => {
    setupStubs(false)
    cy.visit(`/account/${gatewayAccountExternalId}/settings`)
    cy.get('.govuk-summary-list__value').eq(1).should('contain', 'Off')
    cy.get('a').contains('Change Google Pay settings').click()
    cy.get('input[type="radio"]').should('have.length', 2)
    cy.get('input[value="on"]').should('not.be.checked')
    cy.get('input[value="off"]').should('be.checked')
    cy.get('#navigation-menu-settings').click()
    cy.get('.govuk-summary-list__value').eq(1).should('contain', 'Off')
  })

  it('should show it is enabled', () => {
    setupStubs(true)
    cy.visit(`/account/${gatewayAccountExternalId}/settings`)
    cy.get('.govuk-summary-list__value').eq(1).should('contain', 'On')
    cy.get('a').contains('Change Google Pay settings').click()
    cy.get('input[type="radio"]').should('have.length', 2)
    cy.get('input[value="on"]').should('be.checked')
    cy.get('input[value="off"]').should('not.be.checked')
    cy.get('#navigation-menu-settings').click()
    cy.get('.govuk-summary-list__value').eq(1).should('contain', 'On')
  })

  it('should allow us to enable', () => {
    setupStubs(false)

    cy.visit(`/account/${gatewayAccountExternalId}/settings`)
    cy.get('.govuk-summary-list__value').eq(1).should('contain', 'Off')
    cy.get('a').contains('Change Google Pay settings').click()

    cy.get('input[value="on"]').click()
    cy.get('input[value="on"]').should('be.checked')
    cy.get('#merchantId').type('111111111111111')
    cy.get('.govuk-button').contains('Save changes').click()

    cy.location().should((location) => {
      expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/settings`)
    })
    cy.get('.govuk-notification-banner--success').should('contain', 'Google Pay successfully enabled')
  })
})
