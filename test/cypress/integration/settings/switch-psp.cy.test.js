'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const connectorChargeStubs = require('../../stubs/connector-charge-stubs')

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
            cy.get('.app-task-list__item').eq(1).should('contain', 'Make a live payment to test your Worldpay PSP')
              .find('.app-task-list__tag').should('have.text', 'cannot start yet')
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
        cy.get('.app-task-list__item').eq(1).should('contain', 'Make a live payment to test your Worldpay PSP')
          .find('.app-task-list__tag').should('have.text', 'not started')
      })
    })

    describe('PSP integration verified with live payment', () => {
      it('should now be clickable and navigate to the verify PSP integration page', () => {
        cy.task('setupStubs', [
          ...getUserAndAccountStubs('smartpay', true, [
            { payment_provider: 'smartpay', state: 'ACTIVE' },
            { payment_provider: 'worldpay', state: 'ENTERED' }
          ])
        ])

        cy.get('.app-task-list__item').contains('Make a live payment to test your Worldpay PSP').click()
        cy.get('h1').should('contain', 'Test the connection between Worldpay and GOV.UK Pay')
        cy.get('.govuk-back-link').should('contain', 'Back to Switching payment service provider (PSP)')
      })

      it('should create a charge and continue to charges next url on success', () => {
        cy.task('setupStubs', [
          ...getUserAndAccountStubs('smartpay', true, [
            { payment_provider: 'smartpay', state: 'ACTIVE' },
            { payment_provider: 'worldpay', state: 'ENTERED' }
          ]),
          connectorChargeStubs.postCreateChargeSuccess({
            gateway_account_id: gatewayAccountId,
            charge_id: 'a-valid-charge-external-id',
            next_url: 'http://localhost:3000/should_follow_to_payment_page'
          })
        ])
        cy.get('button').contains('Continue to live payment').click()
        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/should_follow_to_payment_page`)
        })
      })

      it('returning with a failed payment should present an error with request session charge id maintained', () => {
        cy.task('setupStubs', [
          ...getUserAndAccountStubs('smartpay', true, [
            { payment_provider: 'smartpay', state: 'ACTIVE' },
            { payment_provider: 'worldpay', state: 'ENTERED' }
          ]),
          connectorChargeStubs.getChargeSuccess({
            gateway_account_id: gatewayAccountId,
            charge_id: 'a-valid-charge-external-id',
            status: 'cancelled',
            next_url: 'http://localhost:3000/should_follow_to_payment_page'
          })
        ])
        cy.visit(`/account/${gatewayAccountExternalId}/switch-psp/verify-psp-integration/callback`)

        cy.get('.govuk-error-summary__body').first().contains('Your live payment was not successful')
      })

      it('returning with a successful payment should present completion message with request session charge id maintained', () => {
        cy.task('setupStubs', [
          ...getUserAndAccountStubs('smartpay', true, [
            { payment_provider: 'smartpay', state: 'ACTIVE' },
            { payment_provider: 'worldpay', state: 'VERIFIED_WITH_LIVE_PAYMENT' }
          ]),
          connectorChargeStubs.postCreateChargeSuccess({
            gateway_account_id: gatewayAccountId,
            charge_id: 'a-valid-charge-external-id',
            next_url: 'http://localhost:3000/should_follow_to_payment_page'
          }),
          connectorChargeStubs.getChargeSuccess({
            gateway_account_id: gatewayAccountId,
            charge_id: 'a-valid-charge-external-id',
            status: 'success',
            next_url: 'http://localhost:3000/should_follow_to_payment_page'
          })
        ])

        cy.get('.app-task-list__item').contains('Make a live payment to test your Worldpay PSP').click()
        cy.get('button').contains('Continue to live payment').click()
        cy.visit(`/account/${gatewayAccountExternalId}/switch-psp/verify-psp-integration/callback`)
        cy.get('.govuk-notification-banner__content').contains('Your live payment has succeeded')
      })
    })
  })
})
