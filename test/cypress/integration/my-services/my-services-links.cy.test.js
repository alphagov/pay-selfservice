'use strict'

const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const userStubs = require('../../stubs/user-stubs')
const payoutStubs = require('../../stubs/payout-stubs')

const authenticatedUserId = 'authenticated-user-id'

describe('Service has a live account that supports payouts', () => {
  beforeEach(() => {
    // keep the same session for entire describe block
    Cypress.Cookies.preserveOnce('session', 'gateway_account')
  })

  it('should display link to view payouts', () => {
    cy.task('setupStubs', [
      userStubs.getUserSuccess({ userExternalId: authenticatedUserId, gatewayAccountId: '1' }),
      gatewayAccountStubs.getGatewayAccountsSuccess({ gatewayAccountId: '1', type: 'live', paymentProvider: 'stripe' })
    ])

    cy.setEncryptedCookies(authenticatedUserId, 1)
    cy.visit('/my-services')
    cy.title().should('eq', 'Choose service - GOV.UK Pay')

    cy.contains('a', 'View payments to your bank account')
  })

  it('should direct to the list payouts page', () => {
    cy.task('setupStubs', [
      userStubs.getUserSuccess({ userExternalId: authenticatedUserId, gatewayAccountId: '1' }),
      gatewayAccountStubs.getGatewayAccountsSuccess({ gatewayAccountId: '1', type: 'live', paymentProvider: 'stripe' }),
      payoutStubs.getLedgerPayoutSuccess({ gatewayAccountId: '1' })
    ])
    cy.contains('a', 'View payments to your bank account').click()
    cy.get('h1').contains('Payments to your bank account')
  })
})

describe('Service does not have a live account that supports payouts', () => {
  it('should display link to view payouts', () => {
    cy.task('setupStubs', [
      userStubs.getUserSuccess({ userExternalId: authenticatedUserId, gatewayAccountId: '1' }),
      gatewayAccountStubs.getGatewayAccountsSuccess({ gatewayAccountId: '1', type: 'test', paymentProvider: 'stripe' })
    ])

    cy.setEncryptedCookies(authenticatedUserId, 1)
    cy.visit('/my-services')
    cy.title().should('eq', 'Choose service - GOV.UK Pay')

    cy.contains('a', 'View payments to your bank account').should('not.exist')
  })
})

describe('User has access to no live services', () => {
  it('should not display link to all service transactions', () => {
    cy.task('setupStubs', [
      userStubs.getUserSuccess({ userExternalId: authenticatedUserId, gatewayAccountId: '1' }),
      gatewayAccountStubs.getGatewayAccountsSuccess({ gatewayAccountId: '1', type: 'test', paymentProvider: 'sandbox' })
    ])

    cy.setEncryptedCookies(authenticatedUserId, 1)
    cy.visit('/my-services')
    cy.title().should('eq', 'Choose service - GOV.UK Pay')

    cy.contains('a', 'View transactions for all live services').should('not.exist')
  })
})

describe('User has access to one or more live services', () => {
  it('should display link to all service transactions', () => {
    cy.task('setupStubs', [
      userStubs.getUserSuccess({ userExternalId: authenticatedUserId, gatewayAccountId: '1' }),
      gatewayAccountStubs.getGatewayAccountsSuccess({ gatewayAccountId: '1', type: 'live', paymentProvider: 'worldpay' })
    ])

    cy.setEncryptedCookies(authenticatedUserId, 1)
    cy.visit('/my-services')
    cy.title().should('eq', 'Choose service - GOV.UK Pay')

    cy.contains('a', 'View transactions for all live services')
  })
})
