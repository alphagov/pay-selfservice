'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')

const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
const gatewayAccountId = '42'
const gatewayAccountExternalId = 'a-valid-external-id'
const merchantId = 'abc'
const username = 'me'
const password = '1'

function getUserAndAccountStubs (paymentProvider, providerSwitchEnabled, gatewayAccountCredentials) {
  return [
    userStubs.getUserSuccess({ gatewayAccountId, userExternalId }),
    gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({ gatewayAccountId, gatewayAccountExternalId, providerSwitchEnabled, paymentProvider, ...gatewayAccountCredentials && { gatewayAccountCredentials } })
  ]
}

describe('Switch PSP settings page', () => {
  beforeEach(() => {
    Cypress.Cookies.preserveOnce('session', 'gateway_account')
  })

  describe('When using an account with switching flag disabled', () => {
    beforeEach(() => {
      cy.task('setupStubs', getUserAndAccountStubs('smartpay', false))
    })

    it('should not show link to Switch PSP in the side navigation', () => {
      cy.setEncryptedCookies(userExternalId)
      cy.visit(`/account/${gatewayAccountExternalId}/settings`)
      cy.get('#navigation-menu-switch-psp').should('have.length', 0)
    })
  })

  describe('When using an account with switching flag enabled', () => {
    describe('Switching is not started', () => {

      beforeEach(() => {
        cy.task('setupStubs', getUserAndAccountStubs('smartpay', true, [
          { payment_provider: 'smartpay', state: 'ACTIVE' },
          { payment_provider: 'worldpay', state: 'CREATED' }
        ]))
      })

      it('should show the switch PSP page for switching to Worldpay', () => {
        cy.setEncryptedCookies(userExternalId)
        cy.visit(`/account/${gatewayAccountExternalId}/switch-psp`)
        cy.get('#navigation-menu-switch-psp').should('have.length', 1)
        cy.get('h1').should('contain', 'Switch payment service provider')
        cy.get('li').contains('your Worldpay account credentials: Merchant code, username and password').should('exist')
        cy.get('#switch-psp-action-step').should('contain', 'Switch PSP to Worldpay')
      })

      it('should have task list for Worldpay with correct tags', () => {
        cy.get('.app-task-list>li').eq(0).should('contain', 'Get ready to switch PSP')
          .within(() => {
            cy.get('.app-task-list__item').eq(0).should('contain', 'Link your Worldpay account with GOV.UK Pay')
              .find('.app-task-list__tag').should('have.text', 'not started')
          })
      })

      it('should navigate to link Worldpay account step', () => {
        cy.get('.app-task-list__item').contains('Link your Worldpay account with GOV.UK Pay').click()
        cy.get('h1').should('contain', 'Your Worldpay credentials')
        cy.get('.govuk-back-link').should('contain', 'Back to Switching payment service provider (PSP)')
      })
    })

    describe('Worldpay account linked', () => {
      beforeEach(() => {
        cy.task('setupStubs', [
          ...getUserAndAccountStubs('smartpay', true, [
            { payment_provider: 'smartpay', state: 'ACTIVE' },
            { payment_provider: 'worldpay', state: 'ENTERED' }
          ]),
          gatewayAccountStubs.postCheckWorldpayCredentials({
            gatewayAccountId,
            merchant_id: merchantId,
            username,
            password
          })
        ])
      })

      it('should submit Worldpay credentials', () => {
        cy.get('#merchantId').type('abc')
        cy.get('#username').type('me')
        cy.get('#password').type('1')
        cy.get('button').contains('Save credentials').click()
      })

      it('should go back to task list with the link Worldpay account step complete', () => {
        cy.get('.app-task-list__item').eq(0).should('contain', 'Link your Worldpay account with GOV.UK Pay')
          .find('.app-task-list__tag').should('have.text', 'completed')
      })
    })
  })
})
