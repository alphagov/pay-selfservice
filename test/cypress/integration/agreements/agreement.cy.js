const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const agreementStubs = require('../../stubs/agreement-stubs')
const transactionStubs = require('../../stubs/transaction-stubs')

const userExternalId = 'some-user-id'
const gatewayAccountId = 10
const gatewayAccountExternalId = 'gateway-account-id'
const serviceExternalId = 'service-id'

const userAndGatewayAccountStubs = function (role) {
  return [
    userStubs.getUserSuccess({
      userExternalId,
      serviceExternalId,
      gatewayAccountId,
      role: role
    }),
    gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
      gatewayAccountId,
      gatewayAccountExternalId,
      serviceExternalId,
      recurringEnabled: true
    })
  ]
}

const transactionsStub = transactionStubs.getLedgerTransactionsSuccess({
  gatewayAccountId,
  transactions: [
    { reference: 'payment-reference', amount: 1000, type: 'payment' },
    { reference: 'second-reference', amount: 20000, type: 'payment' }
  ],
  filters: {
    agreement_id: 'a-valid-agreement-id',
    display_size: 5
  }
})

describe('Agreement detail page', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId)
  })

  it('should display agreement detail page and allow cancelling agreement', () => {
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs(),
      agreementStubs.getLedgerAgreementSuccess({
        service_id: serviceExternalId,
        live: false,
        gatewayAccountId,
        external_id: 'a-valid-agreement-id'
      }),
      transactionsStub
    ])

    cy.visit('/test/service/service-id/account/gateway-account-id/agreements/a-valid-agreement-id')

    cy.get('h1').contains('Agreement detail')

    cy.task('clearStubs')

    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs(),
      agreementStubs.postConectorCancelAgreementSuccess({
        gatewayAccountId,
        external_id: 'a-valid-agreement-id'
      }),
      agreementStubs.getLedgerAgreementSuccess({
        service_id: serviceExternalId,
        live: false,
        gatewayAccountId,
        external_id: 'a-valid-agreement-id',
        status: 'CANCELLED',
        cancelledDate: '2023-06-15T12:36:00.000Z',
        cancelledByUserEmail: 'sandor@example.gov'
      }),
      transactionsStub
    ])

    cy.get('[data-cy=cancel-agreement-button]').click()
    cy.get('[data-cy=confirm-cancel-agreement-button]').click()

    cy.get('[data-cy=success-notifcation]').contains('Agreement cancelled')
    cy.get('[data-cy=cancel-agreement-container]').should('not.exist')

    cy.get('[data-cy=agreement-detail]').contains('15 June 2023')
    cy.get('[data-cy=agreement-detail]').contains('sandor@example.gov')
  })

  it('should display generic error page when cancelling an agreement fails', () => {
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs(),
      agreementStubs.getLedgerAgreementSuccess({
        service_id: serviceExternalId,
        live: false,
        gatewayAccountId,
        external_id: 'a-valid-agreement-id'
      }),
      transactionsStub
    ])

    cy.visit('/test/service/service-id/account/gateway-account-id/agreements/a-valid-agreement-id')

    cy.get('h1').contains('Agreement detail')

    cy.task('clearStubs')

    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs(),
      agreementStubs.postConectorCancelAgreementFailure({
        gatewayAccountId,
        external_id: 'a-valid-agreement-id'
      })
    ])

    cy.get('[data-cy=cancel-agreement-button]').click()
    cy.get('[data-cy=confirm-cancel-agreement-button]').click()

    cy.get('h1').contains('An error occurred')
  })

  it('should not display cancel agreement if the user does not have permissions', () => {
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs({ permissions: [{ name: 'agreements:read' }] }),
      agreementStubs.getLedgerAgreementSuccess({
        service_id: serviceExternalId,
        live: false,
        gatewayAccountId,
        external_id: 'a-valid-agreement-id'
      }),
      transactionsStub
    ])

    cy.visit('/test/service/service-id/account/gateway-account-id/agreements/a-valid-agreement-id', { failOnStatusCode: false })

    cy.get('h1').contains('Agreement detail')
    cy.get('[data-cy=cancel-agreement-container]').should('not.exist')
  })
})
