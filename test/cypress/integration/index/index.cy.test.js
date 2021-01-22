'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const transactionsSummaryStubs = require('../../stubs/transaction-summary-stubs')

const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
const gatewayAccountId = '42'
const gatewayAccountExternalId = 'a-gateway-account-external-id'

describe('The index page', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId, gatewayAccountId)

    cy.task('setupStubs', [
      userStubs.buildGetUserSuccessStub(userExternalId, {
        external_id: userExternalId,
        service_roles: [
          {
            service: {
              gateway_account_ids: ['1', '13', gatewayAccountId]
            }
          }
        ]
      }),
      gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId, gatewayAccountExternalId }),
      gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({ gatewayAccountId, gatewayAccountExternalId }),
      transactionsSummaryStubs.getDashboardStatistics()
    ])
  })

  it('should redirect to the dashboard for the gateway account id in the cookie', () => {
    cy.visit('/')
    cy.get('h1').should('contain', 'Dashboard')
    cy.location().should((location) => {
      expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/dashboard`)
    })
  })
})