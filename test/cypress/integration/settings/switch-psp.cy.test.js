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
      cy.get('.service-info--tag').should('not.contain', 'switching psp')
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

      it('should show dashboard message for switching psp', () => {
        cy.setEncryptedCookies(userExternalId)
        cy.visit(`/account/${gatewayAccountExternalId}/dashboard`)
        cy.get('.govuk-notification-banner__heading').should('contain', 'Switch your payment service provider (PSP) to Worldpay')
      })

      it('should show the switch message for current psp page', () => {
        cy.visit(`/account/${gatewayAccountExternalId}/settings`)
        cy.get('a').contains('Your PSP - Smartpay').click()
        cy.get('#switched-psp-status').should('contain', 'Your service is ready to switch PSP from Smartpay to Worldpay.')
      })

      it('should show the switch PSP page for switching to Worldpay', () => {
        cy.visit(`/account/${gatewayAccountExternalId}/switch-psp`)
        cy.get('.service-info--tag').should('contain', 'switch psp')
        cy.get('#navigation-menu-switch-psp').should('have.length', 1)
        cy.get('h1').should('contain', 'Switch payment service provider')
        cy.get('li').contains('your Worldpay account credentials: Merchant code, username and password').should('exist')
        cy.get('#switch-psp-action-step').should('contain', 'Switch PSP to Worldpay')
        cy.get('.govuk-warning-text').should('contain','Once you switch, Worldpay will immediately start taking payments. You can refund previous payments through Smartpay.')
      })

      it('should have task list for Worldpay with correct tags', () => {
        cy.get('.app-task-list>li').eq(0).should('contain', 'Get ready to switch PSP')
          .within(() => {
            cy.get('.app-task-list__item').eq(0).should('contain', 'Link your Worldpay account with GOV.UK Pay')
              .find('.app-task-list__tag').should('have.text', 'not started')
            cy.get('.app-task-list__item').eq(1).should('contain', 'Make a live payment to test your Worldpay PSP')
              .find('.app-task-list__tag').should('have.text', 'cannot start yet')
          })
        cy.get('button').contains('Switch to Worldpay').should('have.disabled')
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
            next_url: '/should_follow_to_payment_page'
          })
        ])
        cy.get('button').contains('Continue to live payment').click()
        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/should_follow_to_payment_page`)
        })
      })

      it('returning with a failed payment should present an error', () => {
        cy.task('setupStubs', [
          ...getUserAndAccountStubs('smartpay', true, [
            { payment_provider: 'smartpay', state: 'ACTIVE' },
            { payment_provider: 'worldpay', state: 'ENTERED' }
          ]),
          connectorChargeStubs.getChargeSuccess({
            gateway_account_id: gatewayAccountId,
            charge_id: 'a-valid-charge-external-id',
            status: 'cancelled',
            next_url: '/should_follow_to_payment_page'
          })
        ])
        cy.visit(`/account/${gatewayAccountExternalId}/switch-psp/verify-psp-integration/callback`)

        cy.get('.govuk-error-summary__body').first().contains('Please check your Worldpay credentials and try making another payment.')
        cy.get('.govuk-back-link').click()
      })

      it('returning with a successful payment should present completion message', () => {
        cy.task('setupStubs', [
          ...getUserAndAccountStubs('smartpay', true, [
            { payment_provider: 'smartpay', state: 'ACTIVE' },
            { payment_provider: 'worldpay', state: 'VERIFIED_WITH_LIVE_PAYMENT' }
          ]),
          connectorChargeStubs.postCreateChargeSuccess({
            gateway_account_id: gatewayAccountId,
            charge_id: 'a-valid-charge-external-id',
            next_url: '/should_follow_to_payment_page'
          }),
          connectorChargeStubs.getChargeSuccess({
            gateway_account_id: gatewayAccountId,
            charge_id: 'a-valid-charge-external-id',
            status: 'success',
            next_url: '/should_follow_to_payment_page'
          })
        ])

        cy.get('.app-task-list__item').contains('Make a live payment to test your Worldpay PSP').click()
        cy.get('button').contains('Continue to live payment').click()
        cy.visit(`/account/${gatewayAccountExternalId}/switch-psp/verify-psp-integration/callback`)
        cy.get('.govuk-notification-banner__content').contains('Your live payment has succeeded')
      })
    })

    describe('Switch PSP', () => {
      beforeEach(() => {
        cy.task('setupStubs', getUserAndAccountStubs('smartpay', true, [
          { payment_provider: 'smartpay', state: 'ACTIVE' },
          { payment_provider: 'worldpay', state: 'VERIFIED_WITH_LIVE_PAYMENT' }
        ]))
      })

      it('submits and navigates through to success page with appropriate message', () => {
        cy.get('button').contains('Switch to Worldpay').click()
        cy.get('.govuk-notification-banner__heading').contains('You\'ve switched payment service provider')
        cy.get('.govuk-notification-banner__content').contains('Your service is now taking payments through Worldpay. You can still process refunds of previous payments through Smartpay.')
      })
    })

    describe('Switched PSP', () => {
      beforeEach(() => {
        cy.task('setupStubs', getUserAndAccountStubs('smartpay', true, [
          { payment_provider: 'smartpay', state: 'ACTIVE', external_id: 'a-valid-external-id-smartpay', active_start_date: '2018-05-03T00:00:00.000Z' },
          { payment_provider: 'worldpay', state: 'RETIRED', active_end_date: '2018-05-03T00:00:00.000Z', external_id: 'a-valid-external-id-worldpay' }
        ]))
      })

      it('sets transitioned text on the old psp page', () => {
        cy.visit(`/account/${gatewayAccountExternalId}/settings`)
        cy.get('a').contains('Old PSP - Worldpay').click()
        cy.get('#switched-psp-status').should('contain', 'This service is taking payments with Smartpay. It switched from using Worldpay on 3 May 2018')
      })

      it('sets transitioned text on the your psp page for new provider', () => {
        cy.visit(`/account/${gatewayAccountExternalId}/settings`)
        cy.get('a').contains('Your PSP - Smartpay').click()
        cy.get('#switched-psp-status').should('contain', 'This service started taking payments with Smartpay on 3 May 2018.')
      })
    })
  })
})
