import userStubs from '@test/cypress/stubs/user-stubs'
import { WORLDPAY } from '@models/constants/payment-providers'
import gatewayAccountStubs from '@test/cypress/stubs/gateway-account-stubs'
import { TransactionFixture } from '@test/fixtures/transaction/transaction.fixture'
import { checkServiceNavigation, checkTitleAndHeading } from '../common/assertions'
import { TEST } from '@models/gateway-account/gateway-account-type'
import transactionStubs from '@test/cypress/stubs/transaction-stubs'
import { last12MonthsStartDate } from '@utils/simplified-account/services/dashboard/datetime-utils'
import { reference } from '@controllers/simplified-account/services/payment-links/create'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { penceToPoundsWithCurrency } from '@utils/currency-formatter'
import { CardDetailsFixture } from '@test/fixtures/card-details/card-details.fixture'
import { TransactionData } from '@models/transaction/dto/Transaction.dto'
import { Status } from '@models/transaction/types/status'
import { Reason } from '@models/transaction/types/reason'
import { ResourceType } from '@models/transaction/types/resource-type'
import { TransactionSearchParams } from '@models/transaction/TransactionSearchParams.class'

const TRANSACTION = new TransactionFixture().toTransactionData()

const USER_EXTERNAL_ID = 'user123abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const GATEWAY_ACCOUNT_ID = 1
const SERVICE_NAME = {
  en: 'McDuck Enterprises',
  cy: 'Mentrau McDuck',
}

const TRANSACTIONS_LIST_URL = `/service/${SERVICE_EXTERNAL_ID}/account/${TEST}/transactions`
const TRANSACTION_URL = (transactionId: string) => `/service/${SERVICE_EXTERNAL_ID}/account/${TEST}/transactions/${transactionId}`

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
  ])
}

function assertTransactionRow(row: number, reference: string, transactionLink: string, email: string, amount: string, cardBrand: string, state: string, fee?: string, netAmount?: string) {
  cy.get('#transactions-list tbody').find('tr').eq(row).find('th').should('contain', reference)
  cy.get('#transactions-list tbody').find('tr > th').eq(row).find('.reference')
    .should('have.attr', 'href', transactionLink)
  cy.get('#transactions-list tbody').find('tr').eq(row).find('.email').should('contain', email)
  cy.get('#transactions-list tbody').find('tr').eq(row).find('.amount').should('contain', amount)
  cy.get('#transactions-list tbody').find('tr').eq(row).find('.brand').should('contain', cardBrand)
  cy.get('#transactions-list tbody').find('tr').eq(row).find('.state').should('contain', state)

  if (netAmount) {
    cy.get('#transactions-list tbody').find('tr').eq(row).get('[data-cell-type="net"]').eq(row).find('span').should('have.text', netAmount)
  }

  if (fee) {
    cy.get('#transactions-list tbody').find('tr').eq(row).get('[data-cell-type="fee"]').eq(row).should('have.text', fee)
  }
}


describe('Transactions index', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)

  })

  describe('Common page content', () => {
    beforeEach(() => {
      sharedStubs()
      cy.task('setupStubs', [
        transactionStubs.getLedgerTransactionsSuccess({
          gatewayAccountId: GATEWAY_ACCOUNT_ID,
          transactions: [TRANSACTION],
          filters: { from_date: last12MonthsStartDate },
          displaySize: 20,
          transactionLength: 1
        })
      ])
      cy.visit(TRANSACTIONS_LIST_URL, { failOnStatusCode: false })
    })

    it('should show the transactions item in the side bar in an active state', () => {
      checkServiceNavigation('Transactions', TRANSACTIONS_LIST_URL)
      checkTitleAndHeading('Transactions', SERVICE_NAME.en)
    })

    it('accessibility check', () => {
      cy.a11yCheck()
    })
  })

  describe('Filtering', () => {
    beforeEach(() => {
      sharedStubs()
    })

    it('should display correctly when there are no results', () => {
      cy.task('setupStubs', [
        transactionStubs.getLedgerTransactionsSuccess({
          gatewayAccountId: GATEWAY_ACCOUNT_ID,
          transactions: [],
          filters: { from_date: last12MonthsStartDate },
          displaySize: 20,
          transactionLength: 1
        })
      ])
      cy.visit(TRANSACTIONS_LIST_URL, { failOnStatusCode: false })

      cy.get('#transactions-list tbody').should('not.exist')
    })

    it('should display unfiltered results', () => {
      const transactions: TransactionData[] = []

      for (let i = 1; i <= 3; i++) {
        transactions.push(new TransactionFixture({ amount: i * 1111, reference: `reference${i}`, externalId: `transaction${i}` }).toTransactionData())
      }

      cy.task('setupStubs', [
        transactionStubs.getLedgerTransactionsSuccess({
          gatewayAccountId: GATEWAY_ACCOUNT_ID,
          transactions,
          filters: { from_date: last12MonthsStartDate },
          displaySize: 20,
          transactionLength: transactions.length,
        })
      ])
      cy.visit(TRANSACTIONS_LIST_URL, { failOnStatusCode: false })

      assertTransactionRow(0, transactions[0].reference, TRANSACTION_URL(transactions[0].transaction_id),
        transactions[0].email!, penceToPoundsWithCurrency(transactions[0].amount), transactions[0].card_details!.card_brand!, 'Success')

      assertTransactionRow(1, transactions[1].reference, TRANSACTION_URL(transactions[1].transaction_id),
        transactions[1].email!, penceToPoundsWithCurrency(transactions[1].amount), transactions[1].card_details!.card_brand!, 'Success')

      assertTransactionRow(2, transactions[2].reference, TRANSACTION_URL(transactions[2].transaction_id),
        transactions[2].email!, penceToPoundsWithCurrency(transactions[2].amount), transactions[2].card_details!.card_brand!, 'Success')

      cy.get('#transactions-list tbody').find('tr').should('have.length', transactions.length)
      cy.get('[data-cy=pagination-detail]').contains(`Showing 1 to ${transactions.length} of ${transactions.length} transactions`)
    })

    it('should check if the user has entered a potential PAN into the reference field', () => {
      cy.task('setupStubs', [
        transactionStubs.getLedgerTransactionsSuccess({
          gatewayAccountId: GATEWAY_ACCOUNT_ID,
          transactions: [TRANSACTION],
          filters: { from_date: last12MonthsStartDate },
          displaySize: 20,
          transactionLength: 1,
        })
      ])
      cy.visit(TRANSACTIONS_LIST_URL, { failOnStatusCode: false })

      cy.get('[data-cy=reference-filter]').type('4242424242424242')
      cy.get('[data-cy=email-filter]').click()

      cy.get('[data-cy=reference-filter]').parent().should('have.class', 'govuk-form-group--error')
      cy.get('[data-cy=pan-error]').should('exist')

      cy.get('[data-cy=reference-filter]').clear()
      cy.get('[data-cy=reference-filter]').type('a reference')
      cy.get('[data-cy=email-filter]').click()

      cy.get('[data-cy=reference-filter]').parent().should('not.have.class', 'govuk-form-group--error')
      cy.get('[data-cy=pan-error]').should('not.exist')

      cy.get('[data-cy=reference-filter]').clear()
      cy.get('[data-cy=reference-filter]').type('4444333322221111')
      cy.get('[data-cy=email-filter]').click()

      cy.get('[data-cy=reference-filter]').parent().should('have.class', 'govuk-form-group--error')
      cy.get('[data-cy=pan-error]').should('exist')
    })
  })

  describe('Transaction display', () => {
    it('should display card fee with corporate card surcharge transaction', () => {
      sharedStubs('test')
      const transactionAmounts = { corporateCardSurcharge: 25, fee: 15, totalAmount: 1075 }
      const transactionWithFees = new TransactionFixture({ ...transactionAmounts }).toTransactionData()

      cy.task('setupStubs', [
        transactionStubs.getLedgerTransactionsSuccess({
          gatewayAccountId: GATEWAY_ACCOUNT_ID,
          transactions: [transactionWithFees],
          filters: { from_date: last12MonthsStartDate },
          displaySize: 20,
          transactionLength: 1
        })
      ])
      cy.visit(TRANSACTIONS_LIST_URL, { failOnStatusCode: false })

      cy.get('#transactions-list tbody').find('tr').should('have.length', [transactionWithFees].length)
      cy.get('#transactions-list tbody').find('tr').should('contain', penceToPoundsWithCurrency(transactionWithFees.total_amount!)).and('contain', '(with card fee)')
    })

    it('should display the fee and total columns for Stripe provider service', () => {
      sharedStubs('test', 'stripe')

      const transactionAmounts = { netAmount: 1000, fee: 30, amount: 1030 }
      const stripeTransaction = new TransactionFixture({ ...transactionAmounts }).toTransactionData()

      cy.task('setupStubs', [
        transactionStubs.getLedgerTransactionsSuccess({
          gatewayAccountId: GATEWAY_ACCOUNT_ID,
          transactions: [stripeTransaction],
          filters: { from_date: last12MonthsStartDate },
          displaySize: 20,
          transactionLength: 1
        })
      ])
      cy.visit(TRANSACTIONS_LIST_URL, { failOnStatusCode: false })

      cy.get('#transactions-list tbody').find('tr').first().get('[data-cell-type="fee"]').first().should('contain', penceToPoundsWithCurrency(stripeTransaction.fee!))
      cy.get('#transactions-list tbody').find('tr').first().get('[data-cell-type="net"]').first().find('span').should('contain', penceToPoundsWithCurrency(stripeTransaction.net_amount!))
    })

    it('should display dispute statuses in the dropdown and dispute transactions correctly - when enabled', () => {
      sharedStubs('test', 'stripe')

      const parentTransactionOfDispute = new TransactionFixture({ disputed: true }).toTransactionData()
      const createdDate = new TransactionFixture().createdDate

      const disputeTransaction = {
        gateway_account_id: GATEWAY_ACCOUNT_ID,
        amount: 1000,
        fee: 100,
        net_amount: 900,
        finished: true,
        status: Status.NEEDS_RESPONSE,
        created_date: createdDate.plus({ month: 4 }),
        type: ResourceType.DISPUTE,
        includePaymentDetails: true,
        evidence_due_date: createdDate.plus({ month: 5 }),
        reason: Reason.FRAUDULENT,
        transaction_id: parentTransactionOfDispute.gateway_transaction_id + '1a',
        parent_transaction_id: parentTransactionOfDispute,
      }

      cy.task('setupStubs', [
        transactionStubs.getLedgerTransactionsSuccess({
          gatewayAccountId: GATEWAY_ACCOUNT_ID,
          transactions: [parentTransactionOfDispute],
          filters: {
            from_date: last12MonthsStartDate,
          },
          displaySize: 20,
          transactionLength: 1
        }),
        transactionStubs.getLedgerDisputeTransactionsSuccess({
          disputeTransactionsDetails: {
            parent_transaction_id: parentTransactionOfDispute.transaction_id,
            gateway_account_id: GATEWAY_ACCOUNT_ID,
            transactions: [disputeTransaction],
          },
        }),
      ])
      cy.visit(TRANSACTIONS_LIST_URL, { failOnStatusCode: false })

      cy.get('#list-of-sectors-state').invoke('text').should('contain', 'Dispute awaiting evidence')
      cy.get('#list-of-sectors-state').invoke('text').should('contain', 'Dispute under review')
      cy.get('#list-of-sectors-state').invoke('text').should('contain', 'Dispute won in your favour')
      cy.get('#list-of-sectors-state').invoke('text').should('contain', 'Dispute lost to customer')

      cy.get('#state').click()
      cy.get('#list-of-sectors-state .govuk-checkboxes__input[value=\'dispute_awaiting_evidence\']').trigger('mouseover').click()

      cy.contains('Search transactions').click()

      // cy.get('.transactions-list--row').should('have.length', 2)
      // cy.get('#charge-id-parent-transaction-id-1').should('exist')
      // cy.get('#charge-id-parent-transaction-id-2').should('exist')
    })
  })
})
