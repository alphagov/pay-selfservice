'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const transactionsSummaryStubs = require('../../stubs/transaction-summary-stubs')

describe('The disabled account banner', () => {
  const gatewayAccountId = '22'
  const gatewayAccountType = 'test'

  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const serviceExternalId = 'service123abc'

  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId)
    cy.task('setupStubs', [
      userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceExternalId }),
      gatewayAccountStubs.getAccountByServiceIdAndAccountType(serviceExternalId, gatewayAccountType, {
        disabled: true
      }),
      transactionsSummaryStubs.getDashboardStatistics(),
      gatewayAccountStubs.getGatewayAccountsSuccess({ gatewayAccountId })
    ])
  })

  it('should be displayed if the account is disabled', () => {
    cy.visit(`/service/${serviceExternalId}/account/${gatewayAccountType}/dashboard`)

    cy.get('p.govuk-notification-banner__heading').contains('GOV.UK Pay has disabled payment and refund creation for this account')
  })
})
