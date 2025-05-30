const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const userStubs = require('../../stubs/user-stubs')
const payoutStubs = require('../../stubs/payout-stubs')

const authenticatedUserId = 'authenticated-user-id'
const myServicesPageTitle = 'My services - GOV.UK Pay'

function getUserAndAccountStubs (type, paymentProvider) {
  return [userStubs.getUserSuccess({ userExternalId: authenticatedUserId, gatewayAccountId: '1' }),
    gatewayAccountStubs.getGatewayAccountsSuccess({
      gatewayAccountId: '1',
      type,
      paymentProvider
    })
  ]
}

describe('My Services view', () => {
  it('should show create new service button that is navigable', () => {
    cy.task('setupStubs', getUserAndAccountStubs('live', 'worldpay'))

    cy.setEncryptedCookies(authenticatedUserId)
    cy.visit('/my-services')
    cy.title().should('eq', myServicesPageTitle)
    cy.get('a').contains('Add a new service').click()
    cy.title().should('eq', 'Service name - GOV.UK Pay')
    cy.get('a').contains('Back').click()
    cy.title().should('eq', myServicesPageTitle)
  })
})

describe('User has access to Worldpay services', () => {
  it('should display WORLDPAY TEST SERVICE label on the Worldpay Test Service only', () => {
    cy.task('setupStubs', [
      userStubs.getUserSuccessWithMultipleServices(authenticatedUserId, [
        { serviceName: { en: 'Service with a Worldpay test account only' }, gatewayAccountIds: ['10'] }
      ]),
      gatewayAccountStubs.getGatewayAccountsSuccess({ gatewayAccountId: '10', type: 'test', paymentProvider: 'worldpay' })
    ])
    cy.setEncryptedCookies(authenticatedUserId)

    cy.visit('/my-services')
    cy.get('strong').should('have.class', 'govuk-tag govuk-tag--grey').contains('Worldpay test service')
  })

  it('should not display WORLDPAY TEST SERVICE label where there is a Worldpay Live account', () => {
    cy.task('setupStubs', [
      userStubs.getUserSuccessWithMultipleServices(authenticatedUserId, [
        { serviceName: { en: 'Service with a Worldpay live account only' }, gatewayAccountIds: ['13'] }
      ]),
      gatewayAccountStubs.getGatewayAccountsSuccess({ gatewayAccountId: '13', type: 'live', paymentProvider: 'worldpay' })
    ])
    cy.setEncryptedCookies(authenticatedUserId)

    cy.visit('/my-services')
    cy.get('h3').should('not.have.class', 'govuk-tag govuk-tag--grey')
  })

  it('should not display WORLDPAY TEST SERVICE label where there are Worldpay and sandbox accounts', () => {
    cy.task('setupStubs', [
      userStubs.getUserSuccessWithMultipleServices(authenticatedUserId, [
        { serviceName: { en: 'Old service with Worldpay and Sandbox test accounts' }, gatewayAccountIds: ['11', '12'] }
      ]),
      gatewayAccountStubs.getGatewayAccountsSuccessForMultipleAccounts([
        { gatewayAccountId: '11', type: 'test', paymentProvider: 'sandbox' },
        { gatewayAccountId: '12', type: 'test', paymentProvider: 'worldpay' }
      ])
    ])
    cy.setEncryptedCookies(authenticatedUserId)

    cy.visit('/my-services')
    cy.get('h3').should('not.have.class', 'govuk-tag govuk-tag--grey')
  })
})

describe('The user has fewer than 8 services', () => {
  it('should show the reports section and list services, but not display the service filter', () => {
    cy.task('setupStubs', getUserAndAccountStubs('live', 'sandbox'))
    cy.setEncryptedCookies(authenticatedUserId)

    cy.visit('/my-services')

    cy.get('h1').should('contain', 'My services')
    cy.get('[data-cy=reports-section]').should('exist')
    cy.get('[data-cy=service-list]').should('exist')

    cy.get('[data-cy=service-filter]').should('not.exist')
    cy.get('p').contains('You do not have any services').should('not.exist')
  })
})

describe('The user has 8 services', () => {
  it('should show the services filter', () => {
    cy.task('setupStubs', [
      userStubs.getUserSuccessWithMultipleServices(authenticatedUserId, [
        { serviceName: { en: 'Service 1' }, gatewayAccountIds: ['1'] },
        { serviceName: { en: 'Service 2' }, gatewayAccountIds: ['2'] },
        { serviceName: { en: 'Service 3' }, gatewayAccountIds: ['3'] },
        { serviceName: { en: 'Service 4' }, gatewayAccountIds: ['4'] },
        { serviceName: { en: 'Service 5' }, gatewayAccountIds: ['5'] },
        { serviceName: { en: 'Service 6' }, gatewayAccountIds: ['6'] },
        { serviceName: { en: 'Service 7' }, gatewayAccountIds: ['7'] },
        { serviceName: { en: 'Service 8' }, gatewayAccountIds: ['8'] }
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

    cy.get('h1').should('contain', 'My services')
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
    cy.title().should('eq', myServicesPageTitle)

    cy.contains('a', 'Payments to your bank account').click()
    cy.get('h1').contains('Payments to your bank account')
  })
})

describe('Service does not have a live account that supports payouts', () => {
  it('should display link to view payouts', () => {
    cy.task('setupStubs', getUserAndAccountStubs('test', 'sandbox'))

    cy.setEncryptedCookies(authenticatedUserId)
    cy.visit('/my-services')
    cy.title().should('eq', myServicesPageTitle)

    cy.contains('a', 'Payments to your bank account').should('not.exist')
  })
})

describe('User has access to no live services', () => {
  it('should link to all service transactions test', () => {
    cy.task('setupStubs', getUserAndAccountStubs('test', 'sandbox'))

    cy.setEncryptedCookies(authenticatedUserId)
    cy.visit('/my-services')
    cy.title().should('eq', myServicesPageTitle)

    cy.contains('a', 'Transactions for all services').should('have.attr', 'href', '/all-service-transactions/test')
  })
})

describe('User has access to one or more live services', () => {
  it('should display link to all service transactions', () => {
    cy.task('setupStubs', getUserAndAccountStubs('live', 'worldpay'))

    cy.setEncryptedCookies(authenticatedUserId)
    cy.visit('/my-services')
    cy.title().should('eq', myServicesPageTitle)

    cy.contains('a', 'Transactions for all services')
  })
})
