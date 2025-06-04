'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const transactionsSummaryStubs = require('../../stubs/transaction-summary-stubs')
const { WORLDPAY } = require('@models/constants/payment-providers')

describe('Worldpay account setup banner', () => {
  const gatewayAccountId = '22'
  const gatewayAccountType = 'live'
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
        serviceExternalId,
        role: { name: roleName },
        features: userFeatures
      }),
      gatewayAccountStubs.getAccountByServiceIdAndAccountType(serviceExternalId, gatewayAccountType, {
        gateway_account_id: gatewayAccountId,
        type: gatewayAccountType,
        payment_provider: WORLDPAY,
        gateway_account_credentials: gatewayAccountCredentials
      }),
      gatewayAccountStubs.getAccountByServiceIdAndAccountType(serviceExternalId, gatewayAccountType, {
        gateway_account_id: gatewayAccountId,
        type: gatewayAccountType,
        payment_provider: WORLDPAY
      }),
      transactionsSummaryStubs.getDashboardStatistics()
    ])
  }

  describe('Admin user', () => {
    it('banner should link to payment provider worldpay details', () => {
      setupStubs('admin', 'degatewayaccountification')

      cy.visit(`/service/${serviceExternalId}/account/${gatewayAccountType}/dashboard`)
      cy.get('.govuk-notification-banner__title').contains('Important')
      cy.get('.govuk-notification-banner__content')
        .contains('Finish setting up your service to start taking payments')
        .parent()
        .contains('You\'ve started to set up your live account. There are still some steps you need to complete.')
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
      cy.visit(`/service/${serviceExternalId}/account/${gatewayAccountType}/dashboard`)

      cy.get('.govuk-notification-banner').should('not.exist')
    })
  })
})
