'use strict'

const { getUserStubWithServiceName, getGatewayAccountsStub } = require('../../utils/common_stubs')

const authenticatedUserId = 'authenticated-user-id'

describe('Service has a live account that supports payouts', () => {
  beforeEach(() => {
    // keep the same session for entire describe block
    Cypress.Cookies.preserveOnce('session')
    Cypress.Cookies.preserveOnce('gateway_account')
  })

  it('should display link to view payouts', () => {
    cy.task('setupStubs', [
      getUserStubWithServiceName(authenticatedUserId, [1]),
      getGatewayAccountsStub(1, 'live', 'stripe')
    ])

    cy.setEncryptedCookies(authenticatedUserId, 1)
    cy.visit('/my-services')
    cy.title().should('eq', 'Choose service - GOV.UK Pay')

    cy.contains('a', 'View payments to your bank account')
  })

  it('should direct to the list payouts page', () => {
    cy.task('setupStubs', [
      getUserStubWithServiceName(authenticatedUserId, [1]),
      getGatewayAccountsStub(1, 'live', 'stripe'),
      {
        name: 'getLedgerPayoutSuccess',
        opts: { gateway_account_id: 1 }
      }
    ])
    cy.contains('a', 'View payments to your bank account').click()
    cy.get('h1').contains('Payments to your bank account')
  })
})

describe('Service does not have a live account that supports payouts', () => {
  it('should display link to view payouts', () => {
    cy.task('setupStubs', [
      getUserStubWithServiceName(authenticatedUserId, [1]),
      getGatewayAccountsStub(1, 'test', 'stripe')
    ])

    cy.setEncryptedCookies(authenticatedUserId, 1)
    cy.visit('/my-services')
    cy.title().should('eq', 'Choose service - GOV.UK Pay')

    cy.contains('a', 'View payments to your bank account').should('not.exist')
  })
})
