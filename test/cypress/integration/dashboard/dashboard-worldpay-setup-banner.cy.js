'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const transactionsSummaryStubs = require('../../stubs/transaction-summary-stubs')

describe('Worldpay account setup banner', () => {
  const gatewayAccountId = '22'
  const gatewayAccountExternalId = 'a-valid-external-id'
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'

  const gatewayAccountCredentials = [{
    payment_provider: 'worldpay',
    state: 'CREATED'
  }]

  function setupStubs (roleName) {
    cy.setEncryptedCookies(userExternalId)
    cy.task('setupStubs', [
      userStubs.getUserSuccess({
        userExternalId,
        gatewayAccountId,
        gatewayAccountExternalId,
        role: { name: roleName }
      }),
      gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
        gatewayAccountId,
        gatewayAccountExternalId,
        type: 'live',
        paymentProvider: 'worldpay',
        gatewayAccountCredentials
      }),
      gatewayAccountStubs.getGatewayAccountsSuccess({ gatewayAccountId }),
      transactionsSummaryStubs.getDashboardStatistics()
    ])
  }

  describe('Admin user', () => {
    it('should display banner if account is worldpay and the credentials are in CREATED state', () => {
      setupStubs('admin')
      cy.visit(`/account/${gatewayAccountExternalId}/dashboard`)

      cy.get('.govuk-notification-banner__title').contains('Important')
      cy.get('.govuk-notification-banner__content')
        .contains('You have not finished setting up your account')
        .parent()
        .contains('You need to connect your Worldpay account to GOV.UK Pay to be able to take payments.')
        .within(() => {
          cy.get('a')
            .should('have.attr', 'href', '/account/a-valid-external-id/your-psp/a-valid-external-id')
            .click()
        })
      cy.get('h1').contains('Your payment service provider (PSP) - Worldpay')
    })
  })

  describe('View only user', () => {
    it('should not display banner for view only user if worldpay account is not fully setup', () => {
      setupStubs('view-only')
      cy.visit(`/account/${gatewayAccountExternalId}/dashboard`)

      cy.get('.govuk-notification-banner').should('not.exist')
    })
  })
})
