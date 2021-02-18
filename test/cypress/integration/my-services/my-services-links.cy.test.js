'use strict'

const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const userStubs = require('../../stubs/user-stubs')
const payoutStubs = require('../../stubs/payout-stubs')

const authenticatedUserId = 'authenticated-user-id'

function getUserAndAccountStubs (type, paymentProvider) {
  return [userStubs.getUserSuccess({ userExternalId: authenticatedUserId, gatewayAccountId: '1' }),
    gatewayAccountStubs.getGatewayAccountsSuccess({ gatewayAccountId: '1', type, paymentProvider })
  ]
}

describe('Service has a live account that supports payouts', () => {
  beforeEach(() => {
    // keep the same session for entire describe block
    Cypress.Cookies.preserveOnce('session', 'gateway_account')
  })

  it('should display link to view payouts', () => {
    cy.task('setupStubs', getUserAndAccountStubs('live', 'stripe'))

    cy.setEncryptedCookies(authenticatedUserId, 1)
    cy.visit('/my-services')
    cy.title().should('eq', 'Choose service - GOV.UK Pay')

    cy.contains('a', 'View payments to your bank account')
  })

  it('should direct to the list payouts page', () => {
    cy.task('setupStubs', [
      ...getUserAndAccountStubs('live', 'stripe'),
      payoutStubs.getLedgerPayoutSuccess({ gatewayAccountId: '1' })
    ])
    cy.contains('a', 'View payments to your bank account').click()
    cy.get('h1').contains('Payments to your bank account')
  })
})

describe('Service does not have a live account that supports payouts', () => {
  it('should display link to view payouts', () => {
    cy.task('setupStubs', getUserAndAccountStubs('test', 'stripe'))

    cy.setEncryptedCookies(authenticatedUserId, 1)
    cy.visit('/my-services')
    cy.title().should('eq', 'Choose service - GOV.UK Pay')

    cy.contains('a', 'View payments to your bank account').should('not.exist')
  })
})

describe('User has access to no live services', () => {
  it('should link to all service transactions test', () => {
    cy.task('setupStubs', getUserAndAccountStubs('test', 'sandbox'))

    cy.setEncryptedCookies(authenticatedUserId, 1)
    cy.visit('/my-services')
    cy.title().should('eq', 'Choose service - GOV.UK Pay')

    cy.contains('a', 'View transactions for all services').should('have.attr', 'href', '/all-service-transactions/test')
  })
})

describe('User has access to one or more live services', () => {
  it('should display link to all service transactions', () => {
    cy.task('setupStubs', getUserAndAccountStubs('live', 'worldpay'))

    cy.setEncryptedCookies(authenticatedUserId, 1)
    cy.visit('/my-services')
    cy.title().should('eq', 'Choose service - GOV.UK Pay')

    cy.contains('a', 'View transactions for all services')
  })
})
