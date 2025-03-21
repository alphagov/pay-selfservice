'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const transactionsSummaryStubs = require('../../stubs/transaction-summary-stubs')
const { WORLDPAY } = require('@models/constants/payment-providers')

describe('Worldpay account setup banner', () => {
  const gatewayAccountId = '22'
  const gatewayAccountType = 'live'
  const gatewayAccountExternalId = 'a-valid-external-id'
  const serviceExternalId = 'service123abc'
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'

  const gatewayAccountCredentials = [{
    payment_provider: 'worldpay',
    state: 'CREATED'
  }]

  function setupStubs (roleName, userFeatures = '') {
    cy.setEncryptedCookies(userExternalId)
    cy.task('setupStubs', [
      userStubs.getUserSuccess({
        userExternalId,
        gatewayAccountId,
        gatewayAccountExternalId,
        serviceExternalId,
        role: { name: roleName },
        features: userFeatures
      }),
      gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
        gatewayAccountId,
        gatewayAccountExternalId,
        type: gatewayAccountType,
        paymentProvider: WORLDPAY,
        gatewayAccountCredentials
      }),
      gatewayAccountStubs.getAccountByServiceIdAndAccountType(serviceExternalId, gatewayAccountType, {
        gateway_account_id: gatewayAccountId,
        type: gatewayAccountType,
        payment_provider: WORLDPAY
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
        .contains('Finish setting up your service to start taking payments')
        .parent()
        .contains('You\'ve started to set up your live account. There are still some steps you need to complete.')
        .within(() => {
          cy.get('a')
            .should('have.attr', 'href', '/account/a-valid-external-id/your-psp/a-valid-external-id')
            .click()
        })
      cy.get('h1').contains('Your payment service provider (PSP) - Worldpay')
    })

    it('banner should link to payment provider stripe details for degatewayed user', () => {
      setupStubs('admin', 'degatewayaccountification')

      cy.visit(`/account/${gatewayAccountExternalId}/dashboard`)
      cy.get('.govuk-notification-banner__title').contains('Important')
      cy.get('.govuk-notification-banner__content')
        .within(() => {
          cy.get('a')
            .should('have.attr', 'href', '/service/service123abc/account/live/settings/worldpay-details')
            .click()
        })
      cy.get('h1').contains('Worldpay details')
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
