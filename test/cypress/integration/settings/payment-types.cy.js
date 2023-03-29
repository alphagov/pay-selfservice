const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')

function setupStubs (userExternalId, gatewayAccountId, gatewayAccountExternalId, serviceName) {
  cy.task('setupStubs', [
    userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceName }),
    gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({ gatewayAccountId, gatewayAccountExternalId }),
    gatewayAccountStubs.getAcceptedCardTypesSuccess({ gatewayAccountId }),
    gatewayAccountStubs.getCardTypesSuccess(),
    gatewayAccountStubs.postUpdateCardTypesSuccess(gatewayAccountId)
  ])
}

describe('Payment types', () => {
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const gatewayAccountId = '42'
  const gatewayAccountExternalId = 'a-valid-external-id'
  const serviceName = 'Purchase a positron projection permit'

  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId)
  })

  it('should display page and allow updating card types', () => {
    setupStubs(userExternalId, gatewayAccountId, gatewayAccountExternalId, serviceName)
    cy.visit(`/account/${gatewayAccountExternalId}/payment-types`)

    cy.title().should('eq', `Manage payment types - ${serviceName} - GOV.UK Pay`)

    cy.get('#debit').should('be.checked')
    cy.get('#debit-2').should('be.checked')

    cy.get('#debit-3').should('be.not.checked')
    cy.get('#debit-3').should('be.disabled')
    cy.get('#debit-3-item-hint').should('be.visible')

    cy.get('#credit').should('be.checked')
    cy.get('#credit-2').should('be.checked')
    cy.get('#credit-3').should('be.checked')
    cy.get('#credit-3-item-hint').should('be.visible')
    cy.get('#credit-4').should('be.not.checked')
    cy.get('#credit-5').should('be.not.checked')
    cy.get('#credit-6').should('be.not.checked')
    cy.get('#credit-7').should('be.not.checked')

    cy.get('#credit-4').click()
    cy.get('#credit-4').should('be.checked')
    cy.get('#save-card-types').click()

    cy.title().should('eq', `Manage payment types - ${serviceName} - GOV.UK Pay`)
    cy.get('.govuk-notification-banner--success')
      .should('exist')
      .should('contain', 'Accepted card types have been updated')
  })

  it('should show error if user tries to disable all card types', () => {
    setupStubs(userExternalId, gatewayAccountId, gatewayAccountExternalId, serviceName)
    cy.visit(`/account/${gatewayAccountExternalId}/payment-types`)

    cy.get('#debit').click()
    cy.get('#debit-2').click()
    cy.get('#credit').click()
    cy.get('#credit-2').click()
    cy.get('#credit-3').click()
    cy.get('#save-card-types').click()
    cy.get('.error-summary').should('be.visible')
  })
})
