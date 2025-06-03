const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const transactionsSummaryStubs = require('../../stubs/transaction-summary-stubs')
const { DateTime } = require('luxon')

describe('Account dashboard', () => {
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const gatewayAccountId = '42'
  const gatewayAccountType = 'test'
  const serviceExternalId = 'service123abc'
  const serviceName = 'Test Service'

  beforeEach(() => {
    const todayStatisticsStub = transactionsSummaryStubs.getDashboardStatisticsWithFromDate(
      DateTime.now()
        .setLocale('en-GB')
        .setZone('Europe/London')
        .startOf('day')
        .toISO(),
      {
        paymentCount: 10,
        paymentTotal: 12000,
        refundCount: 2,
        refundTotal: 2300,
      }
    )
    const prevSevenDaysStatisticsStub = transactionsSummaryStubs.getDashboardStatisticsWithFromDate(
      DateTime.now()
        .setLocale('en-GB')
        .setZone('Europe/London')
        .startOf('day')
        .minus({ days: 7})
        .toISO(),
      {
        paymentCount: 50,
        paymentTotal: 70000,
        refundCount: 10,
        refundTotal: 5000,
      }
    )

    cy.task('setupStubs', [
      userStubs.getUserSuccess({
        userExternalId,
        gatewayAccountId,
        serviceExternalId,
        serviceName: { en: serviceName },
      }),
      gatewayAccountStubs.getAccountByServiceIdAndAccountType(serviceExternalId, gatewayAccountType, {}),
      todayStatisticsStub,
      prevSevenDaysStatisticsStub,
    ])
  })

  it('should display dashboard page', () => {
    cy.setEncryptedCookies(userExternalId)

    cy.visit(`/service/${serviceExternalId}/account/${gatewayAccountType}/dashboard`)
    cy.title().should('eq', `Dashboard - ${serviceName} - GOV.UK Pay`)

    cy.get('.dashboard-total-group__values')
      .eq(0)
      .should('exist')
      .within(() => {
        cy.get('.dashboard-total-group__count').should('have.text', '10')
        cy.get('.dashboard-total-group__amount').should('have.text', '£120.00')
      })

    cy.get('.dashboard-total-group__values')
      .eq(1)
      .should('exist')
      .within(() => {
        cy.get('.dashboard-total-group__count').should('have.text', '2')
        cy.get('.dashboard-total-group__amount').should('have.text', '£23.00')
      })

    cy.get('.dashboard-total-group__values')
      .eq(2)
      .should('exist')
      .within(() => {
        cy.get('.dashboard-total-group__count').should('not.exist')
        cy.get('.dashboard-total-group__amount').should('have.text', '£97.00')
      })

    cy.log('Select a different time range and check statistics are updated')
    cy.get('#activity-period').select('previous-seven-days')
    cy.get('button').contains('Update').click()

    cy.get('.dashboard-total-group__values')
      .eq(0)
      .should('exist')
      .within(() => {
        cy.get('.dashboard-total-group__count').should('have.text', '50')
        cy.get('.dashboard-total-group__amount').should('have.text', '£700.00')
      })

    cy.get('.dashboard-total-group__values')
      .eq(1)
      .should('exist')
      .within(() => {
        cy.get('.dashboard-total-group__count').should('have.text', '10')
        cy.get('.dashboard-total-group__amount').should('have.text', '£50.00')
      })

    cy.get('.dashboard-total-group__values')
      .eq(2)
      .should('exist')
      .within(() => {
        cy.get('.dashboard-total-group__count').should('not.exist')
        cy.get('.dashboard-total-group__amount').should('have.text', '£650.00')
      })
  })
})
