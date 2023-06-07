const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const agreementStubs = require('../../stubs/agreement-stubs')
const transactionStubs = require('../../stubs/transaction-stubs')

const userExternalId = 'some-user-id'
const gatewayAccountId = 10
const gatewayAccountExternalId = 'gateway-account-id'
const serviceExternalId = 'service-id'

const userAndGatewayAccountStubs = [
  userStubs.getUserSuccess({ userExternalId, serviceExternalId, gatewayAccountId }),
  gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
    gatewayAccountId,
    gatewayAccountExternalId,
    serviceExternalId,
    recurringEnabled: true
  })
]

describe('Agreements', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId)
  })

  it('should display agreement detail page and allow cancelling agreement', () => {
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      agreementStubs.getLedgerAgreementSuccess({
        service_id: serviceExternalId,
        live: false,
        gatewayAccountId,
        external_id: 'a-valid-agreement-id'
      }),
      transactionStubs.getLedgerTransactionsSuccess({
        gatewayAccountId,
        transactions: [
          { reference: 'payment-reference', amount: 1000, type: 'payment' },
          { reference: 'second-reference', amount: 20000, type: 'payment' }
        ],
        filters: {
          agreement_id: 'a-valid-agreement-id',
          display_size: 5
        }
      }),
      agreementStubs.postConectorCancelAgreementSuccess({
        gatewayAccountId,
        external_id: 'a-valid-agreement-id'
      }),
      agreementStubs.getLedgerAgreementSuccess({
        service_id: serviceExternalId,
        live: false,
        gatewayAccountId,
        external_id: 'a-valid-agreement-id',
        status: 'CANCELLED'
      })
    ])

    cy.visit('/test/service/service-id/account/gateway-account-id/agreements/a-valid-agreement-id')

    cy.get('h1').contains('Agreement detail')

    cy.task('clearStubs')

    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      agreementStubs.postConectorCancelAgreementSuccess({
        gatewayAccountId,
        external_id: 'a-valid-agreement-id'
      }),
      agreementStubs.getLedgerAgreementSuccess({
        service_id: serviceExternalId,
        live: false,
        gatewayAccountId,
        external_id: 'a-valid-agreement-id',
        status: 'CANCELLED'
      }),
      transactionStubs.getLedgerTransactionsSuccess({
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
    ])

    cy.get('[data-cy=cancel-agreement-button]').click()
    cy.get('[data-cy=confirm-cancel-agreement-button]').click()

    cy.get('[data-cy=success-notifcation]').contains('Agreement cancelled')
    cy.get('[data-cy=cancel-agreement-container]').should('not.exist')
  })
})
