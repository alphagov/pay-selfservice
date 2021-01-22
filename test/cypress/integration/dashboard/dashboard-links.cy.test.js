'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const transactionsSummaryStubs = require('../../stubs/transaction-summary-stubs')

const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
const gatewayAccountId = '42'
const gatewayAccountExternalId = 'a-gateway-account-external-id'
const dashboardUrl = `/account/${gatewayAccountExternalId}/dashboard`

function getStubsForDashboard (gatewayAccountId, type, paymentProvider) {
  return [
    userStubs.getUserSuccess({ userExternalId, gatewayAccountId }),
    gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({ gatewayAccountId, gatewayAccountExternalId, type, paymentProvider }),
    transactionsSummaryStubs.getDashboardStatistics()
  ]
}

describe('the links are displayed correctly on the dashboard', () => {
  describe('card gateway account', () => {
    beforeEach(() => {
      cy.setEncryptedCookies(userExternalId, gatewayAccountId)
    })

    it('should display 3 links for a live sandbox account', () => {
      cy.task('setupStubs', getStubsForDashboard(gatewayAccountId, 'live', 'sandbox'))

      cy.visit(dashboardUrl)
      cy.get('.links__box').should('have.length', 3)

      cy.get('#demo-payment-link').should('exist')
      cy.get('#demo-payment-link').should('have.class', 'flex-grid--column-third')
      cy.get('#demo-payment-link').should('not.have.class', 'border-bottom')

      cy.get('#test-payment-link-link').should('exist')
      cy.get('#test-payment-link-link').should('have.class', 'flex-grid--column-third')
      cy.get('#test-payment-link-link').should('not.have.class', 'border-bottom')

      cy.get('#manage-service-link').should('exist')
      cy.get('#manage-service-link').should('have.class', 'flex-grid--column-third')
      cy.get('#manage-service-link').should('not.have.class', 'border-bottom')
    })

    it('should display 2 links for a live non-sandbox account', () => {
      cy.task('setupStubs', getStubsForDashboard(gatewayAccountId, 'live', 'worldpay'))

      cy.visit(dashboardUrl)
      cy.get('.links__box').should('have.length', 2)

      cy.get('#payment-links-link').should('exist')
      cy.get('#payment-links-link').should('have.class', 'flex-grid--column-half')

      cy.get('#manage-service-link').should('exist')
      cy.get('#manage-service-link').should('have.class', 'flex-grid--column-half')
    })

    it('should display 4 links for a test sandbox account', () => {
      cy.task('setupStubs', getStubsForDashboard(gatewayAccountId, 'test', 'sandbox', 'an-id', 'NOT_STARTED'))

      cy.visit(dashboardUrl)
      cy.get('.links__box').should('have.length', 4)

      cy.get('#demo-payment-link').should('exist')
      cy.get('#demo-payment-link').should('have.class', 'flex-grid--column-half')

      cy.get('#test-payment-link-link').should('exist')
      cy.get('#test-payment-link-link').should('have.class', 'flex-grid--column-half')

      cy.get('#manage-service-link').should('exist')
      cy.get('#manage-service-link').should('have.class', 'flex-grid--column-half')

      cy.get('#request-to-go-live-link').should('exist')
      cy.get('#request-to-go-live-link').should('have.class', 'flex-grid--column-half')
    })

    it('should display 3 links for a test non-sandbox account', () => {
      cy.task('setupStubs', getStubsForDashboard(gatewayAccountId, 'test', 'worldpay'))

      cy.visit(dashboardUrl)
      cy.get('.links__box').should('have.length', 3)

      cy.get('#payment-links-link').should('exist')
      cy.get('#payment-links-link').should('have.class', 'flex-grid--column-third')

      cy.get('#manage-service-link').should('exist')
      cy.get('#manage-service-link').should('have.class', 'flex-grid--column-third')

      cy.get('#request-to-go-live-link').should('exist')
      cy.get('#request-to-go-live-link').should('have.class', 'flex-grid--column-third')
    })
  })
})
