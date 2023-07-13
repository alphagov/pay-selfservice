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

  it('should display agreement detail page', () => {
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

    cy.get('.govuk-heading-l').should('have.text', 'Agreement detail')

    cy.get('[data-cy=agreement-detail]').find('dt').eq(0).contains('ID')
    cy.get('[data-cy=agreement-detail]').find('dd').eq(0).contains('a-valid-agreement-id')
    cy.get('[data-cy=agreement-detail]').find('dt').eq(1).contains('Reference')
    cy.get('[data-cy=agreement-detail]').find('dd').eq(1).contains('valid-reference')
    cy.get('[data-cy=agreement-detail]').find('dt').eq(2).contains('Status')
    cy.get('[data-cy=agreement-detail]').find('dd').eq(2).contains('active')
    cy.get('[data-cy=agreement-detail]').find('dt').eq(3).contains('Description')
    cy.get('[data-cy=agreement-detail]').find('dd').eq(3).contains('Reason shown to paying user for taking agreement')
    cy.get('[data-cy=agreement-detail]').find('dt').eq(4).contains('Date created')
    cy.get('[data-cy=agreement-detail]').find('dd').eq(4).contains('1 March 2022')

    cy.get('[data-cy=payment-instrument-title]').should('have.text', 'Payment instrument')
    cy.get('#payment-instrument-list').should('exist')
    cy.get('#empty-payment-instrument').should('not.exist')
    cy.get('#payment-instrument-list').should('exist')
    cy.get('#payment-instrument-list').children().should('have.length', 6)
    cy.get('#payment-instrument-list').find('dt').eq(0).contains('Type')
    cy.get('#payment-instrument-list').find('dd').eq(0).contains('Card')
    cy.get('#payment-instrument-list').find('dt').eq(1).contains('Card')
    cy.get('#payment-instrument-list').find('dd').eq(1).find('img').should('have.attr', 'src', '/public/images/card_visa.png')
    cy.get('#payment-instrument-list').find('dd').eq(1).get('[alt="Card brand Visa"]').should('exist')
    cy.get('#payment-instrument-list').find('dt').eq(2).contains('Name on card')
    cy.get('#payment-instrument-list').find('dd').eq(2).contains('Test User')
    cy.get('#payment-instrument-list').find('dt').eq(3).contains('Card number')
    cy.get('#payment-instrument-list').find('dd').eq(3).contains('••••0002')
    cy.get('#payment-instrument-list').find('dt').eq(4).contains('Card expiry date')
    cy.get('#payment-instrument-list').find('dd').eq(4).contains('08/23')
    cy.get('#payment-instrument-list').find('dt').eq(5).contains('Card type')
    cy.get('#payment-instrument-list').find('dd').eq(5).contains('Debit')

    cy.get('[data-cy=transaction-list-title]').should('have.text', 'Transactions')
    cy.get('#transactions-list').should('exist')
    cy.get('#transactions-list thead').find('th').eq(0).should('contain', 'Reference number')
    cy.get('#transactions-list thead').find('th').eq(1).should('contain', 'State')
    cy.get('#transactions-list thead').find('th').eq(2).should('contain', 'Amount')
    cy.get('#transactions-list thead').find('th').eq(3).should('contain', 'Date created')
    cy.get('#transactions-list tbody').find('tr').should('have.length', 2)
    cy.get('#transactions-list tbody').find('tr').eq(0).find('.reference').should('contain', 'payment-reference')
    cy.get('#transactions-list tbody').find('tr').eq(0).find('.state').should('contain', 'In progress')
    cy.get('#transactions-list tbody').find('tr').eq(0).find('.amount').should('contain', '£10.00')
    cy.get('#transactions-list tbody').find('tr').eq(0).find('.time').should('contain', '01 May 2018 — 14:27:00')
    cy.get('#transactions-list tbody').find('tr').eq(1).find('.reference').should('contain', 'second-reference')
    cy.get('#transactions-list tbody').find('tr').eq(1).find('.state').should('contain', 'In progress')
    cy.get('#transactions-list tbody').find('tr').eq(1).find('.amount').should('contain', '£200.00')
    cy.get('#transactions-list tbody').find('tr').eq(1).find('.time').should('contain', '01 May 2018 — 14:27:00')

    cy.get('[data-cy=all-payment-link]').should('exist')
  })

  it('should allow cancelling agreement', () => {
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
