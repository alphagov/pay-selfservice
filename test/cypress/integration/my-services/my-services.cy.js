'use strict'

const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const userStubs = require('../../stubs/user-stubs')
const payoutStubs = require('../../stubs/payout-stubs')

const authenticatedUserId = 'authenticated-user-id'

function getUserAndAccountStubs (type, paymentProvider) {
  return [userStubs.getUserSuccess({ userExternalId: authenticatedUserId, gatewayAccountId: '1' }),
    gatewayAccountStubs.getGatewayAccountsSuccess({
      gatewayAccountId: '1',
      type,
      paymentProvider,
      requiresAdditionalKycData: true
    })
  ]
}

describe('The user has fewer than 8 services', () => {
  it('should show the reports section and list services, but not display the service filter', () => {
    cy.task('setupStubs', getUserAndAccountStubs('live', 'sandbox'))
    cy.setEncryptedCookies(authenticatedUserId)

    cy.visit('/my-services')

    cy.get('h1').should('contain', 'Overview')
    cy.get('[data-cy=reports-section]').should('exist')
    cy.get('[data-cy=divider]').should('exist')
    cy.get('[data-cy=service-list]').should('exist')

    cy.get('[data-cy=service-filter]').should('not.exist')
    cy.get('p').contains('You do not have any services').should('not.exist')
  })
})

describe('The user has 8 services', () => {
  it('should show the services filter', () => {
    cy.task('setupStubs', [
      userStubs.getUserSuccessWithMultipleServices(authenticatedUserId, [
        { serviceName: 'Service 1', gatewayAccountIds: ['1'] },
        { serviceName: 'Service 2', gatewayAccountIds: ['2'] },
        { serviceName: 'Service 3', gatewayAccountIds: ['3'] },
        { serviceName: 'Service 4', gatewayAccountIds: ['4'] },
        { serviceName: 'Service 5', gatewayAccountIds: ['5'] },
        { serviceName: 'Service 6', gatewayAccountIds: ['6'] },
        { serviceName: 'Service 7', gatewayAccountIds: ['7'] },
        { serviceName: 'Service 8', gatewayAccountIds: ['8'] }
      ]),
      gatewayAccountStubs.getGatewayAccountsSuccessForMultipleAccounts([
        { gatewayAccountId: 1 },
        { gatewayAccountId: 2 },
        { gatewayAccountId: 3 },
        { gatewayAccountId: 4 },
        { gatewayAccountId: 5 },
        { gatewayAccountId: 6 },
        { gatewayAccountId: 7 },
        { gatewayAccountId: 8 }
      ])
    ])
    cy.setEncryptedCookies(authenticatedUserId)

    cy.visit('/my-services')
    cy.get('[data-cy=service-filter]').should('exist')
  })
})

describe('The user does not have any services', () => {
  it('should not display reports or service list', () => {
    cy.task('setupStubs', [userStubs.getUserSuccessWithNoServices(authenticatedUserId)])
    cy.setEncryptedCookies(authenticatedUserId)

    cy.visit('/my-services')

    cy.get('h1').should('contain', 'Overview')
    cy.get('[data-cy=reports-section]').should('not.exist')
    cy.get('[data-cy=divider]').should('not.exist')
    cy.get('[data-cy=service-filter]').should('not.exist')
    cy.get('[data-cy=service-list]').should('not.exist')
    cy.get('p').contains('You do not have any services').should('exist')
  })
})

describe('Service has a live account that supports payouts', () => {
  it('should display link to view payouts', () => {
    cy.task('setupStubs', [
      ...getUserAndAccountStubs('live', 'stripe'),
      payoutStubs.getLedgerPayoutSuccess({ gatewayAccountId: '1' })
    ])

    cy.setEncryptedCookies(authenticatedUserId)
    cy.visit('/my-services')
    cy.title().should('eq', 'Choose service - GOV.UK Pay')

    cy.contains('a', 'View payments to your bank account').click()
    cy.get('h1').contains('Payments to your bank account')
  })
})

describe('Service does not have a live account that supports payouts', () => {
  it('should display link to view payouts', () => {
    cy.task('setupStubs', getUserAndAccountStubs('test', 'sandbox'))

    cy.setEncryptedCookies(authenticatedUserId)
    cy.visit('/my-services')
    cy.title().should('eq', 'Choose service - GOV.UK Pay')

    cy.contains('a', 'View payments to your bank account').should('not.exist')
  })
})

describe('User has access to no live services', () => {
  it('should link to all service transactions test', () => {
    cy.task('setupStubs', getUserAndAccountStubs('test', 'sandbox'))

    cy.setEncryptedCookies(authenticatedUserId)
    cy.visit('/my-services')
    cy.title().should('eq', 'Choose service - GOV.UK Pay')

    cy.contains('a', 'View transactions for all your services').should('have.attr', 'href', '/all-service-transactions/test')
  })
})

describe('User has access to one or more live services', () => {
  it('should display link to all service transactions', () => {
    cy.task('setupStubs', getUserAndAccountStubs('live', 'worldpay'))

    cy.setEncryptedCookies(authenticatedUserId)
    cy.visit('/my-services')
    cy.title().should('eq', 'Choose service - GOV.UK Pay')

    cy.contains('a', 'View transactions for all your services')
  })
})

describe('Gateway account requires additional KYC data', () => {
  it('should display link to service with INFORMATION NEEDED tag', () => {
    cy.task('setupStubs', getUserAndAccountStubs('live', 'stripe'))

    cy.setEncryptedCookies(authenticatedUserId)
    cy.visit('/my-services')
    cy.title().should('eq', 'Choose service - GOV.UK Pay')

    cy.get('button').should('contain', 'INFORMATION NEEDED')
  })
})
