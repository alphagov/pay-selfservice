const moment = require('moment-timezone')
const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const transactionsSummaryStubs = require('../../stubs/transaction-summary-stubs')

describe('Account dashboard', () => {
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const gatewayAccountId = '42'
  const gatewayAccountExternalId = 'a-gateway-account-external-id'
  const serviceName = 'Test Service'

  beforeEach(() => {
    const todayStatisticsStub = transactionsSummaryStubs.getDashboardStatisticsWithFromDate(
      moment().tz('Europe/London').startOf('day').toISOString(),
      {
        paymentCount: 10,
        paymentTotal: 12000,
        refundCount: 2,
        refundTotal: 2300
      })
    const prevSevenDaysStatisticsStub = transactionsSummaryStubs.getDashboardStatisticsWithFromDate(
      moment().subtract(7, 'days').tz('Europe/London').startOf('day').toISOString(),
      {
        paymentCount: 50,
        paymentTotal: 70000,
        refundCount: 10,
        refundTotal: 5000
      })

    cy.task('setupStubs', [
      userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceName }),
      gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({ gatewayAccountId, gatewayAccountExternalId }),
      gatewayAccountStubs.getGatewayAccountsSuccess({ gatewayAccountId }),
      todayStatisticsStub,
      prevSevenDaysStatisticsStub
    ])
  })

  it('should display dashboard page', () => {
    cy.setEncryptedCookies(userExternalId)

    cy.visit(`/account/${gatewayAccountExternalId}/dashboard`)
    cy.title().should('eq', `Dashboard - ${serviceName} Sandbox test - GOV.UK Pay`)

    cy.get('.dashboard-total-group__values').eq(0).should('exist').within(() => {
      cy.get('.dashboard-total-group__count').should('have.text', '10')
      cy.get('.dashboard-total-group__amount').should('have.text', '£120.00')
    })

    cy.get('.dashboard-total-group__values').eq(1).should('exist').within(() => {
      cy.get('.dashboard-total-group__count').should('have.text', '2')
      cy.get('.dashboard-total-group__amount').should('have.text', '£23.00')
    })

    cy.get('.dashboard-total-group__values').eq(2).should('exist').within(() => {
      cy.get('.dashboard-total-group__count').should('not.exist')
      cy.get('.dashboard-total-group__amount').should('have.text', '£97.00')
    })

    cy.log('Select a different time range and check statistics are updated')
    cy.get('#activity-period').select('previous-seven-days')
    cy.get('button').contains('Update').click()

    cy.get('.dashboard-total-group__values').eq(0).should('exist').within(() => {
      cy.get('.dashboard-total-group__count').should('have.text', '50')
      cy.get('.dashboard-total-group__amount').should('have.text', '£700.00')
    })

    cy.get('.dashboard-total-group__values').eq(1).should('exist').within(() => {
      cy.get('.dashboard-total-group__count').should('have.text', '10')
      cy.get('.dashboard-total-group__amount').should('have.text', '£50.00')
    })

    cy.get('.dashboard-total-group__values').eq(2).should('exist').within(() => {
      cy.get('.dashboard-total-group__count').should('not.exist')
      cy.get('.dashboard-total-group__amount').should('have.text', '£650.00')
    })
  })
})
