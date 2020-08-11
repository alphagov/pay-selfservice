const userStubs = require('../../utils/user-stubs')
const gatewayAccountStubs = require('../../utils/gateway-account-stubs')
const transactionsSummaryStubs = require('../../utils/transaction-summary-stubs')

describe('Dashboard', () => {
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const gatewayAccountId = 42
  const serviceName = 'Test Service'

  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId, gatewayAccountId)

    cy.task('setupStubs', [
      userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceName }),
      gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId }),
      transactionsSummaryStubs.getDashboardStatistics()
    ])
  })

  describe('Homepage', () => {
    const from = encodeURIComponent('2018-05-14T00:00:00+01:00')
    const to = encodeURIComponent('2018-05-15T00:00:00+01:00')

    it(`should have the page title 'Dashboard - ${serviceName} Sandbox test - GOV.UK Pay'`, () => {
      const dashboardUrl = `/?period=today&fromDateTime=${from}&toDateTime=${to}`
      cy.visit(dashboardUrl)
      cy.title().should('eq', `Dashboard - ${serviceName} Sandbox test - GOV.UK Pay`)
    })
  })
})
