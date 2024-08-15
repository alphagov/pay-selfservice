const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')

function setupStubs (userExternalId, gatewayAccountId, gatewayAccountExternalId, serviceName, type = 'test', requires3ds = false) {
  cy.task('setupStubs', [
    userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceName }),
    gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({ gatewayAccountId, gatewayAccountExternalId, type: type, requires3ds: requires3ds }),
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

  context('when the account is test', () => {
    context('when 3DS is not enabled', () => {
      beforeEach(() => {
        setupStubs(userExternalId, gatewayAccountId, gatewayAccountExternalId, serviceName, 'test')
        cy.visit(`/account/${gatewayAccountExternalId}/payment-types`)
      })

      it('should show debit cards that do not require 3DS as enabled and without hint', () => {
        cy.get('#debit-2').should('be.checked')
        cy.get('#debit-2-item-hint').should('not.exist')
      })

      it('should show debit cards requiring 3DS as disabled and with hint', () => {
        cy.get('#debit-3').should('be.disabled')
        cy.get('#debit-3-item-hint').should('be.visible')
        cy.get('#debit-3-item-hint')
          .invoke('text')
          .should('include', 'cannot be used because 3D Secure is not available. Please contact support')
      })
    })

    context('when 3DS is enabled', () => {
      beforeEach(() => {
        setupStubs(userExternalId, gatewayAccountId, gatewayAccountExternalId, serviceName, 'test', true)
        cy.visit(`/account/${gatewayAccountExternalId}/payment-types`)
      })

      it('should show debit cards that do not require 3DS as enabled and without hint', () => {
        cy.get('#debit-2').should('be.checked')
        cy.get('#debit-2-item-hint').should('not.exist')
      })

      it('should show debit cards requiring 3DS as enabled and without hint', () => {
        cy.get('#debit-3').should('not.be.disabled')
        cy.get('#debit-3-item-hint').should('not.exist')
      })
    })
  })

  context('when the account is sandbox', () => {
    beforeEach(() => {
      setupStubs(userExternalId, gatewayAccountId, gatewayAccountExternalId, serviceName, 'sandbox')
      cy.visit(`/account/${gatewayAccountExternalId}/payment-types`)
    })

    it('should show debit cards that do not require 3DS as enabled and without hint', () => {
      cy.get('#debit-2').should('be.checked')
      cy.get('#debit-2-item-hint').should('not.exist')
    })

    it('should show debit cards requiring 3DS as disabled and with hint', () => {
      cy.get('#debit-3').should('be.disabled')
      cy.get('#debit-3-item-hint').should('be.visible')
      cy.get('#debit-3-item-hint')
        .invoke('text')
        .should('include', 'is not available on sandbox test accounts')
    })
  })

  context('when the account is live', () => {
    context('when 3DS is not enabled', () => {
      beforeEach(() => {
        setupStubs(userExternalId, gatewayAccountId, gatewayAccountExternalId, serviceName, 'live')
        cy.visit(`/account/${gatewayAccountExternalId}/payment-types`)
      })

      it('should show debit cards requiring 3DS as disabled and with hint', () => {
        cy.get('#debit-3').should('be.disabled')
        cy.get('#debit-3-item-hint').should('be.visible')
        cy.get('#debit-3-item-hint')
          .invoke('text')
          .should('include', 'cannot be used because 3D Secure is not available. Please contact support')
      })

      it('should show debit cards that do not require 3DS as enabled and without hint', () => {
        cy.get('#debit-2').should('be.checked')
        cy.get('#debit-2-item-hint').should('not.exist')
      })
    })

    context('when 3DS is enabled', () => {
      beforeEach(() => {
        setupStubs(userExternalId, gatewayAccountId, gatewayAccountExternalId, serviceName, 'live', true)
        cy.visit(`/account/${gatewayAccountExternalId}/payment-types`)
      })

      it('should show debit cards that do not require 3DS as enabled and without hint', () => {
        cy.get('#debit-2').should('be.checked')
        cy.get('#debit-2-item-hint').should('not.exist')
      })

      it('should show debit cards requiring 3DS as enabled and without hint', () => {
        cy.get('#debit-3').should('not.be.disabled')
        cy.get('#debit-3-item-hint').should('not.exist')
      })
    })
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
