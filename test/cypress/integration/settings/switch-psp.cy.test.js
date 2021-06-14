'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')

const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
const gatewayAccountId = '42'
const gatewayAccountExternalId = 'a-valid-external-id'

function setupStubs (paymentProvider, providerSwitchEnabled, gatewayAccountCredentials) {
  cy.task('setupStubs', [
    userStubs.getUserSuccess({ gatewayAccountId, userExternalId }),
    gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({ gatewayAccountId, gatewayAccountExternalId, providerSwitchEnabled, paymentProvider, ...gatewayAccountCredentials && { gatewayAccountCredentials } })
  ])
}

describe('Switch PSP settings page', () => {
  beforeEach(() => {
    Cypress.Cookies.preserveOnce('session', 'gateway_account')
  })

  // describe('When using an account with switching flag disabled', () => {
  //   beforeEach(() => {
  //     setupStubs('smartpay', false)
  //   })

  //   it('should not show link to Switch PSP in the side navigation', () => {
  //     cy.setEncryptedCookies(userExternalId)
  //     cy.visit(`/account/${gatewayAccountExternalId}/settings`)
  //     cy.get('#navigation-menu-switch-psp').should('have.length', 0)
  //   })
  // })

  describe('When using an account with switching flag enabled', () => {
    beforeEach(() => {
      setupStubs('smartpay', true, [
        { payment_provider: 'smartpay', state: 'ACTIVE' },
        { payment_provider: 'worldpay', state: 'CREATED' }
      ])
    })

    it('should show the switch PSP page', () => {
      cy.setEncryptedCookies(userExternalId)
      cy.visit(`/account/${gatewayAccountExternalId}/switch-psp`)
      cy.get('#navigation-menu-switch-psp').should('have.length', 1)
      cy.get('h1').should('contain', 'Switch payment service provider')
      cy.get('#switch-psp-action-step').should('contain', 'Switch PSP to Worldpay')
    })
  })
})
