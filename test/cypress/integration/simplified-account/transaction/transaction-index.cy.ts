import userStubs from '@test/cypress/stubs/user-stubs'
import { WORLDPAY } from '@models/constants/payment-providers'
import gatewayAccountStubs from '@test/cypress/stubs/gateway-account-stubs'
import { TransactionFixture } from '@test/fixtures/transaction/transaction.fixture'
import { checkServiceNavigation } from '../common/assertions'
import { TEST } from '@models/gateway-account/gateway-account-type'
import transactionStubs from '@test/cypress/stubs/transaction-stubs'
import { last12MonthsStartDate } from '@utils/simplified-account/services/dashboard/datetime-utils'
import { reference } from '@controllers/simplified-account/services/payment-links/create'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { penceToPoundsWithCurrency } from '@utils/currency-formatter'
import { CardDetailsFixture } from '@test/fixtures/card-details/card-details.fixture'

const TRANSACTION = new TransactionFixture()

const USER_EXTERNAL_ID = 'user123abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const GATEWAY_ACCOUNT_ID = TRANSACTION.gatewayAccountId
const SERVICE_NAME = {
  en: 'McDuck Enterprises',
  cy: 'Mentrau McDuck',
}

const TRANSACTIONS_LIST_URL = `/service/${SERVICE_EXTERNAL_ID}/account/${TEST}/transactions`
const TRANSACTION_URL = (transactionId: string) => `/service/${SERVICE_EXTERNAL_ID}/account/${TEST}/transactions/${transactionId}`

const sharedStubs = (gatewayAccountType = 'test') => {
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
      payment_provider: WORLDPAY,
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
      sharedStubs('test'),
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
    })

    it('accessibility check', () => {
      cy.a11yCheck()
    })
  })

  describe('Filtering', () => {
    beforeEach(() => {
      sharedStubs('test')
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

      const transactions = []

      for (let i = 0; i < 3; i++) {
        transactions.push(new TransactionFixture({ reference: `ref${i}`, externalId: `transaction${i}` }))
      }


      cy.task('setupStubs', [
        transactionStubs.getLedgerTransactionsSuccess({
          gatewayAccountId: GATEWAY_ACCOUNT_ID,
          transactions,
          filters: { from_date: last12MonthsStartDate },
          displaySize: 20,
          transactionLength: transactions.length
        })
      ])
      cy.visit(TRANSACTIONS_LIST_URL, { failOnStatusCode: false })

      // url incorrect
      // card details not pulling through
      assertTransactionRow(0, transactions[0].reference, TRANSACTION_URL(':transactionExternalId'),
        'test2@example.org', penceToPoundsWithCurrency(transactions[0].amount), '', 'Successful')

      cy.get('#transactions-list tbody').find('tr').first().find('th').should('contain', transactions[0].reference)
      cy.get('#transactions-list tbody').find('tr').eq(1).find('th').should('contain', transactions[1].reference)
      cy.get('#transactions-list tbody').find('tr').eq(2).find('th').should('contain', transactions[2].reference)
      cy.get('#transactions-list tbody').find('tr').should('have.length', transactions.length)
      cy.get('[data-cy=pagination-detail]').contains(`Showing 1 to ${transactions.length} of ${transactions.length} transactions`)
    })
  })
})
