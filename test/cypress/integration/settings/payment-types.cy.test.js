const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')

function setupStubs (userExternalId, gatewayAccountId, serviceName, updated = false) {
  cy.task('setupStubs', [
    userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceName }),
    gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId }),
    gatewayAccountStubs.getAcceptedCardTypesSuccess({ gatewayAccountId, updated }),
    gatewayAccountStubs.getCardTypesSuccess()
  ])
}

describe('Payment types', () => {
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const gatewayAccountId = 42
  const serviceName = 'Purchase a positron projection permit'

  beforeEach(() => {
    Cypress.Cookies.preserveOnce('session', 'gateway_account')
  })

  describe('Card types', () => {
    beforeEach(() => {
      setupStubs(userExternalId, gatewayAccountId, serviceName)
    })

    it('should show page title', () => {
      cy.setEncryptedCookies(userExternalId, gatewayAccountId)
      cy.visit('/payment-types')
      cy.title().should('eq', `Manage payment types - ${serviceName} - GOV.UK Pay`)
    })
    it('should show accepted debit cards', () => {
      cy.get('#debit').should('be.checked')
      cy.get('#debit-2').should('be.checked')
    })
    it('should not accepted maestro and should be disabled with hint', () => {
      cy.get('#debit-3').should('be.not.checked')
      cy.get('#debit-3').should('be.disabled')
      cy.get('#debit-3-item-hint').should('be.visible')
    })
    it('should show accepted credit cards and hint about Amex', () => {
      cy.get('#credit').should('be.checked')
      cy.get('#credit-2').should('be.checked')
      cy.get('#credit-3').should('be.checked')
      cy.get('#credit-3-item-hint').should('be.visible')
      cy.get('#credit-4').should('be.not.checked')
      cy.get('#credit-5').should('be.not.checked')
      cy.get('#credit-6').should('be.not.checked')
      cy.get('#credit-7').should('be.not.checked')
    })
  })

  describe('Card types', () => {
    beforeEach(() => {
      setupStubs(userExternalId, gatewayAccountId, serviceName, true)
    })

    it('should update if we add Diners Club', () => {
      cy.get('#credit-4').click()
      cy.get('#credit-4').should('be.checked')
      cy.get('#save-card-types').click()
      cy.get('#credit-4').should('be.checked')
    })
  })

  describe('Card types', () => {
    beforeEach(() => {
      setupStubs(userExternalId, gatewayAccountId, serviceName)
    })

    it('should show error if user tries to disable all card types', () => {
      cy.get('#debit').click()
      cy.get('#debit-2').click()
      cy.get('#credit').click()
      cy.get('#credit-2').click()
      cy.get('#credit-3').click()
      cy.get('#credit-4').click()
      cy.get('#save-card-types').click()
      cy.get('.govuk-error-summary').should('be.visible')
    })
  })
})
