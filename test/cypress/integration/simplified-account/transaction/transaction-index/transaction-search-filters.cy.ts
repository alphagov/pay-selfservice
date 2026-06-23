import { TransactionFixture } from '@test/fixtures/transaction/transaction.fixture'
import {
  getTransactionsForGatewayAccount,
  searchTransactions,
} from '@test/cypress/stubs/simplified-account/transaction-stubs'
import { TransactionStateFixture } from '@test/fixtures/transaction/transaction-state.fixture'
import { PaymentDetailsFixture } from '@test/fixtures/transaction/payment-details.fixture'
import { TEST } from '@models/gateway-account/gateway-account-type'
import userStubs from '@test/cypress/stubs/user-stubs'
import gatewayAccountStubs from '@test/cypress/stubs/gateway-account-stubs'
import { TransactionSearchParamsFixture } from '@test/fixtures/transaction/transaction-search-params.fixture'
import { assertTransactionRow } from '@test/cypress/integration/simplified-account/transaction/utils/assert-transaction-row.assertion'
import { TimeConstants } from '@utils/time/time-constants'

const USER_EXTERNAL_ID = 'user123abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const GATEWAY_ACCOUNT_ID = '100'
const SERVICE_NAME = {
  en: 'McDuck Enterprises',
  cy: 'Mentrau McDuck',
}

const TRANSACTION_URL = (transactionId: string) =>
  `/service/${SERVICE_EXTERNAL_ID}/account/${TEST}/transactions/${transactionId}`

const TX_1 = new TransactionFixture.Payment({
  reference: 'Transaction 1',
  externalId: 'tx1',
  amount: 1000,
  state: TransactionStateFixture.Success(),
})
const TX_2 = new TransactionFixture.Payment({
  reference: 'Transaction 2',
  externalId: 'tx2',
  amount: 2000,
  email: 'homer.simpson@test.example.com',
  state: TransactionStateFixture.Created(),
})
const TX_3 = new TransactionFixture.Payment({
  reference: 'Transaction 3',
  externalId: 'tx3',
  amount: 3000,
  state: TransactionStateFixture.Submitted(),
})
const TX_4 = new TransactionFixture.Payment({
  reference: 'Transaction 4',
  externalId: 'tx4',
  amount: 4000,
  state: TransactionStateFixture.Cancelled(),
})
const TX_5 = new TransactionFixture.Payment({
  reference: 'Transaction 5',
  externalId: 'tx5',
  amount: 5000,
  state: TransactionStateFixture.Timedout(),
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const REFUNDED_TX = new TransactionFixture.Payment({
  amount: 100_00,
  state: TransactionStateFixture.Success(),
  reference: 'This is refunded',
  externalId: 'refundtx1',
  email: 'mr.refunds@test.example.com',
})

// todo verify this against data from ledger
const REFUND_TX = new TransactionFixture.Refund({
  amount: 50_00,
  state: TransactionStateFixture.RefundSuccess(),
  parentTransactionExternalId: 'refundtx1',
  paymentDetails: new PaymentDetailsFixture({
    email: 'mr.refunds@test.example.com',
    reference: 'This is refunded',
  }),
})

const DISPUTE_TX = TransactionFixture.Dispute.Won()

const sharedStubs = (gatewayAccountType = 'test', paymentProvider = 'worldpay') => {
  cy.task('setupStubs', [
    userStubs.getUserSuccess({
      userExternalId: USER_EXTERNAL_ID,
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      serviceName: SERVICE_NAME,
      serviceExternalId: SERVICE_EXTERNAL_ID,
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, gatewayAccountType, {
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      type: gatewayAccountType,
      payment_provider: paymentProvider,
    }),
    gatewayAccountStubs.getCardTypesSuccess(),
    // base transaction search - no filters
    searchTransactions()
      .query(
        new TransactionSearchParamsFixture({
          fromDate: TimeConstants.TWELVE_MONTHS_AGO,
        })
      )
      .success([TX_1, TX_2, TX_3, TX_4, TX_5]),
  ])
}

describe('Transactions list view', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  describe('Search filters', () => {
    describe('no filtering', () => {
      beforeEach(() => {
        sharedStubs()
      })

      it('should display correctly when there are no results', () => {
        cy.task('setupStubs', [getTransactionsForGatewayAccount(GATEWAY_ACCOUNT_ID).success([])])
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${TEST}/transactions`)

        cy.get('#transactions-list tbody').should('not.exist')
      })

      it('should display unfiltered results', () => {
        // cy.task('setupStubs')
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${TEST}/transactions`)

        assertTransactionRow(0, 'Transaction 1', TRANSACTION_URL('tx1'), TX_1.email!, '£10.00', 'Visa', 'Success')

        assertTransactionRow(1, 'Transaction 2', TRANSACTION_URL('tx2'), TX_2.email!, '£20.00', 'Visa', 'Success')

        assertTransactionRow(2, 'Transaction 3', TRANSACTION_URL('tx3'), TX_3.email!, '£30.00', 'Visa', 'Success')

        assertTransactionRow(3, 'Transaction 4', TRANSACTION_URL('tx4'), TX_4.email!, '£40.00', 'Visa', 'Success')

        assertTransactionRow(4, 'Transaction 5', TRANSACTION_URL('tx5'), TX_5.email!, '£50.00', 'Visa', 'Success')

        cy.get('#transactions-list tbody').find('tr').should('have.length', 5)
        cy.get('[data-cy=pagination-detail]').contains(`Showing 1 to 5 of 5 transactions`)
      })
    })

    describe('reference filter', () => {
      beforeEach(() => {
        sharedStubs()
      })

      it('should correctly filter based on the entered reference', () => {
        cy.task('setupStubs', [
          searchTransactions()
            .query(
              new TransactionSearchParamsFixture({
                reference: 'Transaction 1',
                fromDate: TimeConstants.TWELVE_MONTHS_AGO,
              })
            )
            .success([TX_1]),
        ])
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${TEST}/transactions`)

        cy.get('.govuk-form-group')
          .contains('.govuk-label', 'Reference number')
          .parent()
          .within(() => {
            cy.get('input').type('Transaction 1')
          })

        cy.get('button').contains('Search transactions').click()

        assertTransactionRow(0, 'Transaction 1', TRANSACTION_URL('tx1'), TX_1.email!, '£10.00', 'Visa', 'Success')

        cy.get('#transactions-list tbody').find('tr').should('have.length', 1)
        cy.get('[data-cy=pagination-detail]').contains(`Showing 1 to 1 of 1 transactions`)
      })
    })

    describe('email address filter', () => {
      beforeEach(() => {
        sharedStubs()
      })

      it('should correctly filter based on the entered reference', () => {
        cy.task('setupStubs', [
          searchTransactions()
            .query(
              new TransactionSearchParamsFixture({
                email: 'homer.simpson@test.example.com',
                fromDate: TimeConstants.TWELVE_MONTHS_AGO,
              })
            )
            .success([TX_2]),
        ])
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${TEST}/transactions`)

        cy.get('.govuk-form-group')
          .contains('.govuk-label', 'Email address')
          .parent()
          .within(() => {
            cy.get('input').type('homer.simpson@test.example.com')
          })

        cy.get('button').contains('Search transactions').click()

        assertTransactionRow(
          0,
          'Transaction 2',
          TRANSACTION_URL('tx2'),
          'homer.simpson@test.example.com',
          '£20.00',
          'Visa',
          'Success'
        )

        cy.get('#transactions-list tbody').find('tr').should('have.length', 1)
        cy.get('[data-cy=pagination-detail]').contains(`Showing 1 to 1 of 1 transactions`)
      })
    })

    describe('Payment status filter', () => {
      it('should allow for filtering by a single status', () => {
        sharedStubs()
        cy.task('setupStubs', [
          searchTransactions()
            .query(
              new TransactionSearchParamsFixture({
                paymentStates: ['success'],
                fromDate: TimeConstants.TWELVE_MONTHS_AGO,
              })
            )
            .success([TX_1]),
        ])
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${TEST}/transactions`)

        cy.get('.govuk-form-group')
          .contains('.govuk-label', 'Payment status')
          .parent()
          .within(() => {
            cy.get('button').first().click()

            cy.get('.govuk-checkboxes__item > label').contains('Success').click()
          })

        cy.get('button').contains('Search transactions').click()

        assertTransactionRow(0, 'Transaction 1', TRANSACTION_URL('tx1'), TX_1.email!, '£10.00', 'Visa', 'Success')

        cy.get('#transactions-list tbody').find('tr').should('have.length', 1)
        cy.get('[data-cy=pagination-detail]').contains(`Showing 1 to 1 of 1 transactions`)
      })

      it('should allow for filtering by multiple statuses', () => {
        sharedStubs()
        cy.task('setupStubs', [
          searchTransactions()
            .query(
              new TransactionSearchParamsFixture({
                paymentStates: ['created', 'started', 'capturable', 'submitted', 'timedout'],
                fromDate: TimeConstants.TWELVE_MONTHS_AGO,
              })
            )
            .success([TX_2, TX_3, TX_5]),
        ])
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${TEST}/transactions`)

        cy.get('.govuk-form-group')
          .contains('.govuk-label', 'Payment status')
          .parent()
          .within(() => {
            cy.get('button').first().click()

            cy.get('.govuk-checkboxes__item > label').contains('In progress').click()

            cy.get('.govuk-checkboxes__item > label').contains('Timed out').click()
          })

        cy.get('button').contains('Search transactions').click()

        assertTransactionRow(0, 'Transaction 2', TRANSACTION_URL('tx2'), TX_2.email!, '£20.00', 'Visa', 'In progress')
        assertTransactionRow(1, 'Transaction 3', TRANSACTION_URL('tx3'), TX_3.email!, '£30.00', 'Visa', 'In progress')
        assertTransactionRow(2, 'Transaction 5', TRANSACTION_URL('tx5'), TX_5.email!, '£50.00', 'Visa', 'Timed out')

        cy.get('#transactions-list tbody').find('tr').should('have.length', 3)
        cy.get('[data-cy=pagination-detail]').contains(`Showing 1 to 3 of 3 transactions`)
      })

      it('should allow for filtering by refund status', () => {
        sharedStubs()
        cy.task('setupStubs', [
          searchTransactions()
            .query(
              new TransactionSearchParamsFixture({
                refundStates: ['success'],
                fromDate: TimeConstants.TWELVE_MONTHS_AGO,
              })
            )
            .success([REFUND_TX]),
        ])
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${TEST}/transactions`)

        cy.get('.govuk-form-group')
          .contains('.govuk-label', 'Payment status')
          .parent()
          .within(() => {
            cy.get('button').first().click()

            cy.get('.govuk-checkboxes__item > label').contains('Refund success').click()
          })

        cy.get('button').contains('Search transactions').click()

        assertTransactionRow(
          0,
          'This is refunded',
          TRANSACTION_URL('refundtx1'),
          'mr.refunds@test.example.com',
          '£50.00',
          'Visa',
          'Success'
        )

        cy.get('#transactions-list tbody').find('tr').should('have.length', 1)
        cy.get('[data-cy=pagination-detail]').contains(`Showing 1 to 1 of 1 transactions`)
      })

      it('should not allow filtering by dispute status for a worldpay account', () => {
        sharedStubs()
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${TEST}/transactions`)

        cy.get('.govuk-form-group')
          .contains('.govuk-label', 'Payment status')
          .parent()
          .within(() => {
            cy.get('button').first().click()

            cy.get('.govuk-checkboxes__item > label').contains('Dispute awaiting evidence').should('not.exist')
            cy.get('.govuk-checkboxes__item > label').contains('Dispute under review').should('not.exist')
            cy.get('.govuk-checkboxes__item > label').contains('Dispute lost to user').should('not.exist')
            cy.get('.govuk-checkboxes__item > label').contains('Dispute won in your favour').should('not.exist')
          })
      })

      it.only('should allow for filtering by dispute status for a stripe account', () => {
        sharedStubs('test', 'stripe')
        cy.task('setupStubs', [
          searchTransactions()
            .query(
              new TransactionSearchParamsFixture({
                disputeStates: ['won'],
                fromDate: TimeConstants.TWELVE_MONTHS_AGO,
              })
            )
            .success([DISPUTE_TX]),
        ])
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${TEST}/transactions`)

        cy.get('.govuk-form-group')
          .contains('.govuk-label', 'Payment status')
          .parent()
          .within(() => {
            cy.get('button').first().click()

            cy.get('.govuk-checkboxes__item > label').contains('Dispute awaiting evidence').should('exist')
            cy.get('.govuk-checkboxes__item > label').contains('Dispute under review').should('exist')
            cy.get('.govuk-checkboxes__item > label').contains('Dispute lost to user').should('exist')
            cy.get('.govuk-checkboxes__item > label').contains('Dispute won in your favour').should('exist')

            cy.get('.govuk-checkboxes__item > label').contains('Dispute won in your favour').click()
          })

        cy.get('button').contains('Search transactions').click()

        assertTransactionRow(
          0,
          'This is refunded',
          TRANSACTION_URL('refundtx1'),
          'mr.refunds@test.example.com',
          '£50.00',
          'Visa',
          'Success'
        )

        cy.get('#transactions-list tbody').find('tr').should('have.length', 1)
        cy.get('[data-cy=pagination-detail]').contains(`Showing 1 to 1 of 1 transactions`)
      })
    })

    // it('should be able to filter using date-time pickers', () => {
    //   cy.task('setupStubs', [
    //     getTransactionsForGatewayAccount(GATEWAY_ACCOUNT_ID).success(unfilteredTransactions),
    //     getLedgerTransactionsSuccess({
    //       gatewayAccountId: GATEWAY_ACCOUNT_ID,
    //       displaySize: 20,
    //       filters: { from_date: '2025-01-01T00:00:00.000Z', to_date: '2026-01-01T23:59:59.999Z' },
    //       transactions: [TRANSACTION],
    //       transactionLength: 1,
    //     }),
    //   ])
    //
    //   cy.visit(TRANSACTIONS_LIST_URL)
    //
    //   cy.get('.datepicker').should('not.exist')
    //
    //   cy.contains('Search transactions').click()
    //
    //   cy.get('#transactions-list tbody')
    //     .find('tr')
    //     .first()
    //     .find('th')
    //     .should('contain', unfilteredTransactions[0].reference)
    //   cy.get('#transactions-list tbody')
    //     .find('tr')
    //     .eq(1)
    //     .find('th')
    //     .should('contain', unfilteredTransactions[1].reference)
    //   cy.get('#transactions-list tbody')
    //     .find('tr')
    //     .eq(2)
    //     .find('th')
    //     .should('contain', unfilteredTransactions[2].reference)
    //
    //   cy.get('#fromDate').type('01/01/2025')
    //   cy.get('.datepicker').should('be.visible')
    //
    //   cy.get('#toDate').type('01/01/2026')
    //   cy.get('.datepicker').should('be.visible')
    //
    //   cy.get('.govuk-button').contains('Search transactions').click()
    //
    //   cy.get('#transactions-list tbody').find('tr').first().find('th').should('contain', TRANSACTION.reference)
    //
    //   cy.get('#fromDate').should('have.value', '01/01/2025')
    //   cy.get('#toDate').should('have.value', '01/01/2026')
    // })
    //
    // it('should be able to filter using date ranges', () => {
    //   const now = DateTime.now().setLocale('en-GB').setZone('Europe/London')
    //   const yesterday = now.minus({ days: 1 })
    //
    //   const transactionFromYesterday = new TransactionFixture({
    //     reference: 'transaction-yesterday',
    //     createdDate: yesterday.set({ hour: 11 }),
    //   }).toTransactionData()
    //
    //   cy.task('setupStubs', [
    //     getTransactionsForGatewayAccount(GATEWAY_ACCOUNT_ID).success(unfilteredTransactions),
    //     getLedgerTransactionsSuccess({
    //       gatewayAccountId: GATEWAY_ACCOUNT_ID,
    //       displaySize: 20,
    //       filters: {
    //         from_date: yesterday.startOf('day').toUTC().toISO(),
    //         to_date: yesterday.endOf('day').toUTC().toISO(),
    //       },
    //       transactions: [transactionFromYesterday],
    //       transactionLength: 1,
    //     }),
    //   ])
    //
    //   cy.visit(TRANSACTIONS_LIST_URL)
    //
    //   cy.get('#dateFilter').select('yesterday')
    //   cy.contains('Search transactions').click()
    //
    //   cy.get('#fromDate').get('#toDate').should('have.value', yesterday.toFormat('dd/LL/yyyy'))
    //
    //   cy.get('#transactions-list tbody').find('tr').should('have.length', [transactionFromYesterday].length)
    //   cy.get('#transactions-list tbody')
    //     .find('tr')
    //     .first()
    //     .find('th')
    //     .should('contain', transactionFromYesterday.reference)
    // })
    //
    // it('should check if the user has entered a potential PAN into the reference field', () => {
    //   cy.task('setupStubs', [getTransactionsForGatewayAccount(GATEWAY_ACCOUNT_ID).success([TRANSACTION])])
    //   cy.visit(TRANSACTIONS_LIST_URL, { failOnStatusCode: false })
    //
    //   cy.get('[data-cy=reference-filter]').type('4242424242424242')
    //   cy.get('[data-cy=email-filter]').click()
    //
    //   cy.get('[data-cy=reference-filter]').parent().should('have.class', 'govuk-form-group--error')
    //   cy.get('[data-cy=pan-error]').should('exist')
    //
    //   cy.get('[data-cy=reference-filter]').clear()
    //   cy.get('[data-cy=reference-filter]').type('a reference')
    //   cy.get('[data-cy=email-filter]').click()
    //
    //   cy.get('[data-cy=reference-filter]').parent().should('not.have.class', 'govuk-form-group--error')
    //   cy.get('[data-cy=pan-error]').should('not.exist')
    //
    //   cy.get('[data-cy=reference-filter]').clear()
    //   cy.get('[data-cy=reference-filter]').type('4444333322221111')
    //   cy.get('[data-cy=email-filter]').click()
    //
    //   cy.get('[data-cy=reference-filter]').parent().should('have.class', 'govuk-form-group--error')
    //   cy.get('[data-cy=pan-error]').should('exist')
    // })
  })
})
