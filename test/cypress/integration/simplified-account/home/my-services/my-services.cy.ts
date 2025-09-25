import gatewayAccountStubs from '@test/cypress/stubs/gateway-account-stubs'
import userStubs from '@test/cypress/stubs/user-stubs'
import payoutStubs from '@test/cypress/stubs/payout-stubs'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import PaymentProviders from '@models/constants/payment-providers'
import GoLiveStage from '@models/constants/go-live-stage'

const authenticatedUserId = 'user123abc'
const myServicesPageTitle = 'My services - GOV.UK Pay'

function getUserAndAccountStubs(type: string, paymentProvider: string) {
  return [
    userStubs.getUserSuccess({
      userExternalId: authenticatedUserId,
      gatewayAccountId: '1',
      goLiveStage: GoLiveStage.LIVE,
    }),
    gatewayAccountStubs.getGatewayAccountsSuccess({
      gatewayAccountId: '1',
      type,
      paymentProvider,
    }),
  ]
}

describe('My Services view', () => {
  it('should show create new service button that is navigable', () => {
    cy.task('setupStubs', getUserAndAccountStubs(GatewayAccountType.LIVE, PaymentProviders.WORLDPAY))

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
  it('should display "Worldpay test" status tag for Worldpay test service', () => {
    cy.task('setupStubs', [
      userStubs.getUserSuccessWithMultipleServices(authenticatedUserId, [
        {
          serviceName: { en: 'Worldpay test service' },
          gatewayAccountIds: ['10'],
          goLiveStage: GoLiveStage.NOT_STARTED,
        },
      ]),
      gatewayAccountStubs.getGatewayAccountsSuccess({
        gatewayAccountId: '10',
        type: GatewayAccountType.TEST,
        paymentProvider: PaymentProviders.WORLDPAY,
      }),
    ])
    cy.setEncryptedCookies(authenticatedUserId)

    cy.visit('/my-services')
    cy.get('#service-links__container')
      .find('.service-link__status')
      .find('strong')
      .should('have.class', 'govuk-tag govuk-tag--grey')
      .contains('Worldpay test')
  })

  it('should not display any status tag for Worldpay Live account', () => {
    cy.task('setupStubs', [
      userStubs.getUserSuccessWithMultipleServices(authenticatedUserId, [
        { serviceName: { en: 'Live Worldpay service' }, gatewayAccountIds: ['13'], goLiveStage: GoLiveStage.LIVE },
      ]),
      gatewayAccountStubs.getGatewayAccountsSuccess({
        gatewayAccountId: '13',
        type: GatewayAccountType.LIVE,
        paymentProvider: PaymentProviders.WORLDPAY,
      }),
    ])
    cy.setEncryptedCookies(authenticatedUserId)

    cy.visit('/my-services')
    cy.get('#service-links__container').find('.service-link__status').find('strong').should('have.length', 0)
  })

  it('should not display "Worldpay test" status tag where there are Worldpay and sandbox accounts', () => {
    cy.task('setupStubs', [
      userStubs.getUserSuccessWithMultipleServices(authenticatedUserId, [
        { serviceName: { en: 'Old service with Worldpay and Sandbox test accounts' }, gatewayAccountIds: ['11', '12'] },
      ]),
      gatewayAccountStubs.getGatewayAccountsSuccessForMultipleAccounts([
        { gatewayAccountId: '11', type: GatewayAccountType.TEST, paymentProvider: PaymentProviders.SANDBOX },
        { gatewayAccountId: '12', type: GatewayAccountType.TEST, paymentProvider: PaymentProviders.WORLDPAY },
      ]),
    ])
    cy.setEncryptedCookies(authenticatedUserId)

    cy.visit('/my-services')
    cy.get('#service-links__container')
      .find('.service-link__status')
      .find('strong')
      .should('have.class', 'govuk-tag govuk-tag--blue')
      .contains('Not live yet')
  })
})

describe('The user has fewer than 8 services', () => {
  it('should show the reports section and list services, but not display the service filter', () => {
    cy.task('setupStubs', getUserAndAccountStubs(GatewayAccountType.LIVE, PaymentProviders.WORLDPAY))
    cy.setEncryptedCookies(authenticatedUserId)

    cy.visit('/my-services')

    cy.get('h1').should('contain', 'My services')
    cy.get('#service-links__container').should('exist')
    cy.get('#service-search__container').should('not.exist')
    cy.get('a').contains('Transactions for all services').should('exist')
    cy.get('a').contains('Payments to your bank account').should('not.exist')
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
        { serviceName: { en: 'Service 8' }, gatewayAccountIds: ['8'] },
      ]),
      gatewayAccountStubs.getGatewayAccountsSuccessForMultipleAccounts([
        { gatewayAccountId: 1 },
        { gatewayAccountId: 2 },
        { gatewayAccountId: 3 },
        { gatewayAccountId: 4 },
        { gatewayAccountId: 5 },
        { gatewayAccountId: 6 },
        { gatewayAccountId: 7 },
        { gatewayAccountId: 8 },
      ]),
    ])
    cy.setEncryptedCookies(authenticatedUserId)

    cy.visit('/my-services')
    cy.get('#service-search__container').should('exist')
  })
})

describe('The user does not have any services', () => {
  it('should not display reports or service list', () => {
    cy.task('setupStubs', [userStubs.getUserSuccessWithNoServices(authenticatedUserId)])
    cy.setEncryptedCookies(authenticatedUserId)

    cy.visit('/my-services')

    cy.get('h1').should('contain', 'My services')
    cy.get('#service-links__container').should('not.exist')
    cy.get('#service-search__container').should('not.exist')
    cy.get('a').contains('Transactions for all services').should('not.exist')
    cy.get('a').contains('Payments to your bank account').should('not.exist')

    cy.get('p').contains('You do not have any services').should('exist')
  })
})

describe('Service has a live account that supports payouts', () => {
  it('should display link to view payouts', () => {
    cy.task('setupStubs', [
      ...getUserAndAccountStubs(GatewayAccountType.LIVE, PaymentProviders.STRIPE),
      payoutStubs.getLedgerPayoutSuccess({ gatewayAccountId: '1' }),
    ])

    cy.setEncryptedCookies(authenticatedUserId)
    cy.visit('/my-services')
    cy.title().should('eq', myServicesPageTitle)

    cy.contains('a', 'Payments to your bank account').click()
    cy.get('h1').contains('Payments to your bank account').find('strong').contains('Live')
  })
})

describe('Service does not have a live account that supports payouts', () => {
  it('should not display link to view payouts', () => {
    cy.task('setupStubs', getUserAndAccountStubs(GatewayAccountType.TEST, PaymentProviders.SANDBOX))

    cy.setEncryptedCookies(authenticatedUserId)
    cy.visit('/my-services')
    cy.title().should('eq', myServicesPageTitle)

    cy.get('a').contains('Transactions for all services').should('exist')
    cy.get('a').contains('Payments to your bank account').should('not.exist')
  })
})

describe('User has access to no live services', () => {
  it('should link to all service transactions in sandbox mode', () => {
    cy.task('setupStubs', getUserAndAccountStubs(GatewayAccountType.TEST, PaymentProviders.SANDBOX))

    cy.setEncryptedCookies(authenticatedUserId)
    cy.visit('/my-services')
    cy.title().should('eq', myServicesPageTitle)

    cy.get('a').contains('Transactions for all services').should('have.attr', 'href', '/all-service-transactions/test')
  })
})

describe('User has access to one or more live services', () => {
  it('should display link to all service transactions in live mode', () => {
    cy.task('setupStubs', getUserAndAccountStubs(GatewayAccountType.LIVE, PaymentProviders.WORLDPAY))

    cy.setEncryptedCookies(authenticatedUserId)
    cy.visit('/my-services')
    cy.title().should('eq', myServicesPageTitle)

    cy.get('a').contains('Transactions for all services').should('have.attr', 'href', '/all-service-transactions/live')
  })
})
