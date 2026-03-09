import userStubs from '@test/cypress/stubs/user-stubs'
import gatewayAccountStubs from '@test/cypress/stubs/gateway-account-stubs'
import { TransactionFixture } from '@test/fixtures/transaction/transaction.fixture'
import { checkServiceNavigation, checkTitleAndHeading } from '../common/assertions'
import { TEST } from '@models/gateway-account/gateway-account-type'
import { last12MonthsStartDate } from '@utils/simplified-account/services/dashboard/datetime-utils'
import { penceToPoundsWithCurrency } from '@utils/currency-formatter'
import { TransactionData } from '@models/transaction/dto/Transaction.dto'
import { Status } from '@models/transaction/types/status'
import { ResourceType } from '@models/transaction/types/resource-type'
import { DateTime } from 'luxon'
import { TransactionStateFixture } from '@test/fixtures/transaction/transaction-state.fixture'
import { getTransactionsForGatewayAccount } from '@test/cypress/stubs/simplified-account/transaction-stubs'
import { PaymentDetailsFixture } from '@test/fixtures/transaction/payment-details.fixture'
import { getLedgerTransactionsFailure, getLedgerTransactionsSuccess } from '@test/cypress/stubs/transaction-stubs'

const TRANSACTION = new TransactionFixture().toTransactionData()

const USER_EXTERNAL_ID = 'user123abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const GATEWAY_ACCOUNT_ID = '1'
const SERVICE_NAME = {
  en: 'McDuck Enterprises',
  cy: 'Mentrau McDuck',
}

const TRANSACTIONS_LIST_URL = `/service/${SERVICE_EXTERNAL_ID}/account/${TEST}/transactions`
const TRANSACTION_URL = (transactionId: string) =>
  `/service/${SERVICE_EXTERNAL_ID}/account/${TEST}/transactions/${transactionId}`

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

function assertTransactionRow(
  row: number,
  reference: string,
  transactionLink: string,
  email: string,
  amount: string,
  cardBrand: string,
  state: string,
  fee?: string,
  netAmount?: string
) {
  cy.get('#transactions-list tbody').find('tr').eq(row).find('th').should('contain', reference)
  cy.get('#transactions-list tbody')
    .find('tr > th')
    .eq(row)
    .find('.reference')
    .should('have.attr', 'href', transactionLink)
  cy.get('#transactions-list tbody').find('tr').eq(row).find('.email').should('contain', email)
  cy.get('#transactions-list tbody').find('tr').eq(row).find('.amount').should('contain', amount)
  cy.get('#transactions-list tbody').find('tr').eq(row).find('.brand').should('contain', cardBrand)
  cy.get('#transactions-list tbody').find('tr').eq(row).find('.state').should('contain', state)

  if (netAmount) {
    cy.get('#transactions-list tbody')
      .find('tr')
      .eq(row)
      .get('[data-cell-type="net"]')
      .eq(row)
      .find('span')
      .should('contain', netAmount)
  }

  if (fee) {
    cy.get('#transactions-list tbody').find('tr').eq(row).get('[data-cell-type="fee"]').eq(row).should('contain', fee)
  }
}

function generateTransactions(size: number) {
  const transactions: TransactionData[] = []

  for (let i = 1; i <= size; i++) {
    transactions.push(
      new TransactionFixture({
        amount: i * 1111,
        reference: `reference-${i}`,
        externalId: `transaction-${i}`,
      }).toTransactionData()
    )
  }
  return transactions
}

describe('Transactions index', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  describe('Common page content', () => {
    beforeEach(() => {
      sharedStubs()
      cy.task('setupStubs', [getTransactionsForGatewayAccount(GATEWAY_ACCOUNT_ID).success([TRANSACTION])])
      cy.visit(TRANSACTIONS_LIST_URL)
    })

    it('should show the transactions item in the side bar in an active state', () => {
      checkServiceNavigation('Transactions', TRANSACTIONS_LIST_URL)
      checkTitleAndHeading('Transactions', SERVICE_NAME.en)
    })

    it('accessibility check', () => {
      cy.a11yCheck()
    })
  })

  describe('csv download link', () => {
    beforeEach(() => {
      sharedStubs()
    })
    it('should not display csv download link when results >5k and no filter applied', function () {
      cy.task('setupStubs', [
        getLedgerTransactionsSuccess({
          gatewayAccountId: GATEWAY_ACCOUNT_ID,
          transactions: [TRANSACTION],
          transactionLength: 6000,
          filters: { from_date: last12MonthsStartDate },
          displaySize: 20,
        }),
      ])
      cy.visit(TRANSACTIONS_LIST_URL)

      cy.get('.govuk-button--secondary').contains('Download CSV').should('not.exist')
      cy.get('#csv-download').should('contain', 'Filter results to download a CSV of transactions')
    })

    it('should display csv download link when results >5k and filters applied', function () {
      cy.task('setupStubs', [
        getLedgerTransactionsSuccess({
          gatewayAccountId: GATEWAY_ACCOUNT_ID,
          transactions: [TRANSACTION],
          transactionLength: 6000,
          filters: { reference: 'unfiltered', from_date: last12MonthsStartDate },
          displaySize: 20,
        }),
      ])
      cy.visit(TRANSACTIONS_LIST_URL + '?reference=unfiltered')

      cy.get('.govuk-button--secondary').contains('Download CSV').should('exist')
      cy.get('#csv-download').should('not.exist')
    })

    it('should not display csv download link or informative text when 0 results', function () {
      cy.task('setupStubs', [getTransactionsForGatewayAccount(GATEWAY_ACCOUNT_ID).success([])])

      cy.visit(TRANSACTIONS_LIST_URL)

      cy.get('.govuk-button--secondary').contains('Download CSV').should('not.exist')
      cy.get('#csv-download').should('not.exist')
    })
  })

  describe('Filtering', () => {
    beforeEach(() => {
      sharedStubs()
    })

    const unfilteredTransactions: TransactionData[] = generateTransactions(3)

    it('should display correctly when there are no results', () => {
      cy.task('setupStubs', [getTransactionsForGatewayAccount(GATEWAY_ACCOUNT_ID).success([])])
      cy.visit(TRANSACTIONS_LIST_URL)

      cy.get('#transactions-list tbody').should('not.exist')
    })

    it('should display unfiltered results', () => {
      cy.task('setupStubs', [getTransactionsForGatewayAccount(GATEWAY_ACCOUNT_ID).success(unfilteredTransactions)])
      cy.visit(TRANSACTIONS_LIST_URL)

      assertTransactionRow(
        0,
        unfilteredTransactions[0].reference,
        TRANSACTION_URL(unfilteredTransactions[0].transaction_id),
        unfilteredTransactions[0].email!,
        penceToPoundsWithCurrency(unfilteredTransactions[0].amount),
        unfilteredTransactions[0].card_details!.card_brand,
        'Success'
      )

      assertTransactionRow(
        1,
        unfilteredTransactions[1].reference,
        TRANSACTION_URL(unfilteredTransactions[1].transaction_id),
        unfilteredTransactions[1].email!,
        penceToPoundsWithCurrency(unfilteredTransactions[1].amount),
        unfilteredTransactions[1].card_details!.card_brand,
        'Success'
      )

      assertTransactionRow(
        2,
        unfilteredTransactions[2].reference,
        TRANSACTION_URL(unfilteredTransactions[2].transaction_id),
        unfilteredTransactions[2].email!,
        penceToPoundsWithCurrency(unfilteredTransactions[2].amount),
        unfilteredTransactions[2].card_details!.card_brand,
        'Success'
      )

      cy.get('#transactions-list tbody').find('tr').should('have.length', unfilteredTransactions.length)
      cy.get('[data-cy=pagination-detail]').contains(
        `Showing 1 to ${unfilteredTransactions.length} of ${unfilteredTransactions.length} transactions`
      )
    })

    it('should be able to filter using date-time pickers', () => {
      cy.task('setupStubs', [
        getTransactionsForGatewayAccount(GATEWAY_ACCOUNT_ID).success(unfilteredTransactions),
        getLedgerTransactionsSuccess({
          gatewayAccountId: GATEWAY_ACCOUNT_ID,
          displaySize: 20,
          filters: { from_date: DateTime.local(2025), to_date: DateTime.local(2026) },
          transactions: [TRANSACTION],
          transactionLength: 1,
        }),
      ])

      cy.visit(TRANSACTIONS_LIST_URL)

      cy.get('.datepicker').should('not.exist')

      cy.get('#fromDate').type('01/01/25')
      cy.get('.datepicker').should('be.visible')

      cy.get('#toDate').type('01/01/26')
      cy.get('.datepicker').should('be.visible')

      cy.contains('Search transactions').click()

      cy.get('#transactions-list tbody')
        .find('tr')
        .first()
        .find('th')
        .should('contain', unfilteredTransactions[0].reference)
      cy.get('#transactions-list tbody')
        .find('tr')
        .eq(1)
        .find('th')
        .should('contain', unfilteredTransactions[1].reference)
      cy.get('#transactions-list tbody')
        .find('tr')
        .eq(2)
        .find('th')
        .should('contain', unfilteredTransactions[2].reference)

      cy.get('a').contains('Clear filter').click()

      cy.get('#fromDate').should('be.empty')
      cy.get('#toDate').should('be.empty')
    })

    it('should be able to filter using date ranges', () => {
      const now = DateTime.now().setLocale('en-GB').setZone('Europe/London')
      const yesterday = now.minus({ days: 1 })

      const transactionFromYesterday = new TransactionFixture({
        reference: 'transaction-yesterday',
        createdDate: yesterday.set({ hour: 11 }),
      }).toTransactionData()

      cy.task('setupStubs', [
        getTransactionsForGatewayAccount(GATEWAY_ACCOUNT_ID).success(unfilteredTransactions),
        getLedgerTransactionsSuccess({
          gatewayAccountId: GATEWAY_ACCOUNT_ID,
          displaySize: 20,
          filters: { from_date: yesterday.startOf('day'), to_date: yesterday.endOf('day') },
          transactions: [transactionFromYesterday],
          transactionLength: 1,
        }),
      ])

      cy.visit(TRANSACTIONS_LIST_URL)

      cy.get('#dateFilter').select('yesterday')
      cy.contains('Search transactions').click()

      cy.get('#fromDate').get('#toDate').should('have.value', yesterday.toFormat('dd/LL/yyyy'))

      cy.get('#transactions-list tbody').find('tr').should('have.length', [transactionFromYesterday].length)
      cy.get('#transactions-list tbody')
        .find('tr')
        .first()
        .find('th')
        .should('contain', transactionFromYesterday.reference)
    })

    it('should check if the user has entered a potential PAN into the reference field', () => {
      cy.task('setupStubs', [getTransactionsForGatewayAccount(GATEWAY_ACCOUNT_ID).success([TRANSACTION])])
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

  describe('Display', () => {
    const transactionAmounts = { netAmount: 970, fee: 30, amount: 1000 }
    const transactionWithFees = new TransactionFixture({ ...transactionAmounts }).toTransactionData()

    it('should display card fee with corporate card surcharge transaction', () => {
      sharedStubs('test')
      const transactionAmounts = { corporateCardSurcharge: 25, fee: 15, totalAmount: 1075 }
      const transactionWithCorporateCardSurcharge = new TransactionFixture({
        ...transactionAmounts,
      }).toTransactionData()

      cy.task('setupStubs', [
        getTransactionsForGatewayAccount(GATEWAY_ACCOUNT_ID).success([transactionWithCorporateCardSurcharge]),
      ])
      cy.visit(TRANSACTIONS_LIST_URL)

      cy.get('#transactions-list tbody')
        .find('tr')
        .should('have.length', [transactionWithCorporateCardSurcharge].length)
      cy.get('#transactions-list tbody')
        .find('tr')
        .should('contain', penceToPoundsWithCurrency(transactionWithCorporateCardSurcharge.total_amount!))
        .and('contain', '(with card fee)')
    })

    it('should display the fee and total columns for Stripe provider service', () => {
      sharedStubs('test', 'stripe')

      const transactionAmounts = { netAmount: 1000, fee: 30, amount: 1030 }
      const stripeTransaction = new TransactionFixture({ ...transactionAmounts }).toTransactionData()

      cy.task('setupStubs', [getTransactionsForGatewayAccount(GATEWAY_ACCOUNT_ID).success([stripeTransaction])])
      cy.visit(TRANSACTIONS_LIST_URL)

      cy.get('#transactions-list tbody')
        .find('tr')
        .first()
        .get('[data-cell-type="fee"]')
        .first()
        .should('contain', penceToPoundsWithCurrency(stripeTransaction.fee!))
      cy.get('#transactions-list tbody')
        .find('tr')
        .first()
        .get('[data-cell-type="net"]')
        .first()
        .find('span')
        .should('contain', penceToPoundsWithCurrency(stripeTransaction.net_amount!))
    })

    it('should display dispute statuses in the dropdown', () => {
      sharedStubs('test', 'stripe')
      cy.task('setupStubs', [getTransactionsForGatewayAccount(GATEWAY_ACCOUNT_ID).success([TRANSACTION])])

      cy.visit(TRANSACTIONS_LIST_URL)

      cy.get('#list-of-sectors-state').invoke('text').should('contain', 'Dispute awaiting evidence')
      cy.get('#list-of-sectors-state').invoke('text').should('contain', 'Dispute under review')
      cy.get('#list-of-sectors-state').invoke('text').should('contain', 'Dispute won in your favour')
      cy.get('#list-of-sectors-state').invoke('text').should('contain', 'Dispute lost to customer')
    })

    it('should display refund transactions correctly', () => {
      sharedStubs('test', 'stripe')

      const state = new TransactionStateFixture({ status: Status.SUCCESS })
      const paymentDetails = new PaymentDetailsFixture()
      const refundTransaction = new TransactionFixture({
        externalId: TRANSACTION.transaction_id + '-refund',
        parentTransactionExternalId: TRANSACTION.transaction_id,
        paymentDetails,
        transactionType: ResourceType.REFUND,
        state,
      }).toTransactionData()

      cy.task('setupStubs', [
        getTransactionsForGatewayAccount(GATEWAY_ACCOUNT_ID).success([transactionWithFees, refundTransaction]),
      ])

      cy.visit(TRANSACTIONS_LIST_URL)

      cy.get('.transactions-list--row').should('have.length', 2)

      assertTransactionRow(
        0,
        transactionWithFees.reference,
        TRANSACTION_URL(transactionWithFees.transaction_id),
        transactionWithFees.email!,
        penceToPoundsWithCurrency(transactionWithFees.amount),
        transactionWithFees.card_details!.card_brand,
        'Success'
      )

      assertTransactionRow(
        1,
        refundTransaction.reference,
        TRANSACTION_URL(transactionWithFees.transaction_id),
        refundTransaction.email!,
        penceToPoundsWithCurrency(refundTransaction.amount),
        refundTransaction.card_details!.card_brand,
        'Refund successful',
        '',
        penceToPoundsWithCurrency(-refundTransaction.amount)
      )
    })

    describe('Disputes', () => {
      it('should display amounts correctly for dispute awaiting evidence', () => {
        sharedStubs('test', 'stripe')

        const state = new TransactionStateFixture({ status: Status.NEEDS_RESPONSE })
        const paymentDetails = new PaymentDetailsFixture()
        const disputeTransaction = new TransactionFixture({
          paymentDetails,
          transactionType: ResourceType.DISPUTE,
          state,
        }).toTransactionData()

        cy.task('setupStubs', [
          getTransactionsForGatewayAccount(GATEWAY_ACCOUNT_ID).success([TRANSACTION, disputeTransaction]),
        ])

        cy.visit(TRANSACTIONS_LIST_URL)

        cy.get('.transactions-list--row').should('have.length', 2)

        assertTransactionRow(
          0,
          transactionWithFees.reference,
          TRANSACTION_URL(transactionWithFees.transaction_id),
          transactionWithFees.email!,
          penceToPoundsWithCurrency(transactionWithFees.amount),
          transactionWithFees.card_details!.card_brand,
          'Success'
        )

        assertTransactionRow(
          1,
          disputeTransaction.reference,
          TRANSACTION_URL(disputeTransaction.transaction_id),
          disputeTransaction.email!,
          penceToPoundsWithCurrency(disputeTransaction.amount),
          disputeTransaction.card_details!.card_brand,
          'Dispute awaiting evidence',
          '',
          ''
        )
      })

      it('should display amounts correctly for dispute lost to customer', () => {
        sharedStubs('test', 'stripe')

        const transactionAmounts = { netAmount: 1900, fee: 100, amount: 2000 }
        const disputeTransactionAmounts = { netAmount: 4000, fee: 2000, amount: 2000 }
        const transactionWithFees = new TransactionFixture({ ...transactionAmounts }).toTransactionData()
        const state = new TransactionStateFixture({ status: Status.LOST })
        const paymentDetails = new PaymentDetailsFixture()
        const disputeTransaction = new TransactionFixture({
          paymentDetails,
          transactionType: ResourceType.DISPUTE,
          state,
          ...disputeTransactionAmounts,
        }).toTransactionData()

        cy.task('setupStubs', [
          getTransactionsForGatewayAccount(GATEWAY_ACCOUNT_ID).success([transactionWithFees, disputeTransaction]),
        ])

        cy.visit(TRANSACTIONS_LIST_URL)

        cy.get('.transactions-list--row').should('have.length', 2)

        assertTransactionRow(
          0,
          transactionWithFees.reference,
          TRANSACTION_URL(transactionWithFees.transaction_id),
          transactionWithFees.email!,
          penceToPoundsWithCurrency(transactionWithFees.amount),
          transactionWithFees.card_details!.card_brand,
          'Success'
        )

        assertTransactionRow(
          1,
          disputeTransaction.reference,
          TRANSACTION_URL(disputeTransaction.transaction_id),
          disputeTransaction.email!,
          penceToPoundsWithCurrency(disputeTransaction.amount),
          disputeTransaction.card_details!.card_brand,
          'Dispute lost to customer',
          penceToPoundsWithCurrency(disputeTransactionAmounts.fee),
          penceToPoundsWithCurrency(-disputeTransaction.net_amount!)
        )
      })

      it('should display amounts correctly for dispute won in our favour', () => {
        sharedStubs('test', 'stripe')

        const state = new TransactionStateFixture({ status: Status.WON })
        const paymentDetails = new PaymentDetailsFixture()
        const disputeTransaction = new TransactionFixture({
          paymentDetails,
          transactionType: ResourceType.DISPUTE,
          state,
        }).toTransactionData()

        cy.task('setupStubs', [
          getTransactionsForGatewayAccount(GATEWAY_ACCOUNT_ID).success([TRANSACTION, disputeTransaction]),
        ])

        cy.visit(TRANSACTIONS_LIST_URL)

        cy.get('.transactions-list--row').should('have.length', 2)

        assertTransactionRow(
          0,
          TRANSACTION.reference,
          TRANSACTION_URL(TRANSACTION.transaction_id),
          TRANSACTION.email!,
          penceToPoundsWithCurrency(TRANSACTION.amount),
          TRANSACTION.card_details!.card_brand,
          'Success'
        )

        assertTransactionRow(
          1,
          disputeTransaction.reference,
          TRANSACTION_URL(disputeTransaction.transaction_id),
          disputeTransaction.email!,
          penceToPoundsWithCurrency(disputeTransaction.amount),
          disputeTransaction.card_details!.card_brand,
          'Dispute won in your favour',
          '',
          ''
        )
      })
    })
  })

  describe('Errors', () => {
    beforeEach(() => {
      sharedStubs()
    })

    const errorMessage = 'There is a problem with the payments platform. Please contact the support team.'
    const errorHeading = 'An error occurred'

    it('should show error message on a bad request while retrieving the list of transactions', () => {
      cy.task('setupStubs', [getTransactionsForGatewayAccount(GATEWAY_ACCOUNT_ID).success([TRANSACTION])])

      cy.visit(TRANSACTIONS_LIST_URL)
      cy.task('clearStubs')

      sharedStubs()
      cy.task('setupStubs', [
        getLedgerTransactionsFailure(
          {
            gatewayAccountId: GATEWAY_ACCOUNT_ID,
            transactions: [TRANSACTION],
            filters: {
              from_date: last12MonthsStartDate,
            },
            displaySize: 20,
            transactionLength: 1,
          },
          400
        ),
      ])

      cy.contains('Search transactions').click()

      cy.get('#transactions-list tbody').should('not.exist')
      cy.get('h1').contains(errorHeading)

      cy.get('#errorMsg').contains(errorMessage)
    })

    it('should display the generic error page, if an internal server error occurs while retrieving the list of transactions', () => {
      cy.task('setupStubs', [getTransactionsForGatewayAccount(GATEWAY_ACCOUNT_ID).success([TRANSACTION])])

      cy.visit(TRANSACTIONS_LIST_URL)
      cy.task('clearStubs')

      sharedStubs()
      cy.task('setupStubs', [
        getLedgerTransactionsFailure(
          {
            gatewayAccountId: GATEWAY_ACCOUNT_ID,
            transactions: [TRANSACTION],
            filters: {
              from_date: last12MonthsStartDate,
            },
            displaySize: 20,
            transactionLength: 1,
          },
          500
        ),
      ])

      cy.contains('Search transactions').click()

      cy.get('#transactions-list tbody').should('not.exist')
      cy.get('h1').contains(errorHeading)
      cy.get('#errorMsg').contains(errorMessage)
    })
  })

  describe('Pagination', () => {
    beforeEach(() => {
      sharedStubs()
    })

    const transactionsListPageUrl = (pageNumber: number) => TRANSACTIONS_LIST_URL + `?page=` + pageNumber

    it('should display pagination links with previous page disabled for first page', () => {
      cy.task('setupStubs', [
        getLedgerTransactionsSuccess({
          gatewayAccountId: GATEWAY_ACCOUNT_ID,
          transactions: [TRANSACTION],
          filters: { from_date: last12MonthsStartDate },
          displaySize: 20,
          transactionLength: 50,
        }),
      ])
      cy.visit(TRANSACTIONS_LIST_URL + '?&page=')

      cy.get('nav.govuk-pagination').should('exist').and('have.attr', 'aria-label', 'Bottom of table pagination')
      cy.get('ul.govuk-pagination__list').first().children('li.govuk-pagination__item').should('have.length', 3)

      cy.get('ul.govuk-pagination__list')
        .first()
        .within(() => {
          cy.get('a')
            .first()
            .should('exist')
            .and('have.attr', 'href', transactionsListPageUrl(1))
            .and('contain.text', '1')
        })

      cy.get('li.govuk-pagination__item')
        .find('a.govuk-link.govuk-pagination__link')
        .should('have.attr', 'href', transactionsListPageUrl(1))
        .and('have.attr', 'aria-label', 'Page 1')
        .and('contain.text', '1')

      cy.get('ul.govuk-pagination__list li.govuk-pagination__item')
        .eq(1) // Get the second list item (Page 2)
        .find('a.govuk-link.govuk-pagination__link')
        .should('have.attr', 'href', transactionsListPageUrl(2))
        .and('contain.text', '2')

      cy.get('div.govuk-pagination__next a.govuk-link.govuk-pagination__link')
        .should('have.attr', 'href', transactionsListPageUrl(2))
        .and('have.attr', 'rel', 'next')

      cy.get('div.govuk-pagination__next a.govuk-link.govuk-pagination__link')
        .first()
        .within(() => {
          cy.get('span.govuk-pagination__link-title').should('contain.text', ' Next')
        })

      cy.get('div.govuk-pagination__next svg.govuk-pagination__icon--next').should('exist')
      cy.get('div.govuk-pagination__next svg.govuk-pagination__icon--prev').should('not.exist')
    })

    it('should have both next and previous pagination links enabled', () => {
      cy.task('setupStubs', [
        getLedgerTransactionsSuccess({
          gatewayAccountId: GATEWAY_ACCOUNT_ID,
          transactions: [TRANSACTION],
          filters: { from_date: last12MonthsStartDate },
          displaySize: 20,
          transactionLength: 100,
          page: 3,
        }),
      ])
      cy.visit(TRANSACTIONS_LIST_URL + '?&page=3')

      cy.get('div.govuk-pagination__next a.govuk-link.govuk-pagination__link')
        .should('have.attr', 'href', transactionsListPageUrl(4))
        .and('have.attr', 'rel', 'next')

      cy.get('div.govuk-pagination__prev a.govuk-link.govuk-pagination__link')
        .should('have.attr', 'href', transactionsListPageUrl(2))
        .and('have.attr', 'rel', 'prev')

      cy.get('div.govuk-pagination__next a.govuk-link.govuk-pagination__link')
        .should('have.length', 1)
        .first()
        .within(() => {
          cy.get('span.govuk-pagination__link-title').should('contain.text', ' Next')
        })

      cy.get('div.govuk-pagination__prev a.govuk-link.govuk-pagination__link')
        .should('have.length', 1)
        .first()
        .within(() => {
          cy.get('span.govuk-pagination__link-title').should('contain.text', ' Previous')
        })

      cy.get('svg.govuk-pagination__icon--next').should('exist')
      cy.get('svg.govuk-pagination__icon--prev').should('exist')
    })

    it('should display the next page as disabled for last page', () => {
      cy.task('setupStubs', [
        getLedgerTransactionsSuccess({
          gatewayAccountId: GATEWAY_ACCOUNT_ID,
          transactions: [TRANSACTION],
          filters: { from_date: last12MonthsStartDate },
          displaySize: 20,
          transactionLength: 100,
          page: 5,
        }),
      ])
      cy.visit(TRANSACTIONS_LIST_URL + '?&page=5')

      cy.get('div.govuk-pagination__prev a.govuk-link.govuk-pagination__link')
        .should('have.attr', 'href', transactionsListPageUrl(4))
        .and('have.attr', 'rel', 'prev')

      cy.get('div.govuk-pagination__prev a.govuk-link.govuk-pagination__link')
        .should('have.length', 1)
        .first()
        .within(() => {
          cy.get('span.govuk-pagination__link-title').should('contain.text', ' Previous')
        })

      cy.get('div.govuk-pagination__next a.govuk-link.govuk-pagination__link').should('not.exist')

      cy.get('svg.govuk-pagination__icon--next').should('not.exist')
      cy.get('svg.govuk-pagination__icon--prev').should('exist')
    })

    it('should not display pagination links', () => {
      cy.task('setupStubs', [
        getLedgerTransactionsSuccess({
          gatewayAccountId: GATEWAY_ACCOUNT_ID,
          transactions: [TRANSACTION],
          filters: { from_date: last12MonthsStartDate },
          displaySize: 20,
          transactionLength: 10,
          page: 1,
        }),
      ])
      cy.visit(TRANSACTIONS_LIST_URL)

      cy.get('div.govuk-pagination__next a.govuk-link.govuk-pagination__link').should('not.exist')
      cy.get('div.govuk-pagination__prev a.govuk-link.govuk-pagination__link').should('not.exist')

      cy.get('svg.govuk-pagination__icon--next').should('not.exist')
      cy.get('svg.govuk-pagination__icon--prev').should('not.exist')
    })

    it('should navigate to next page correctly with all filters intact', () => {
      const reference = TRANSACTION.reference
      const email = TRANSACTION.email
      const cardholderName = TRANSACTION.card_details?.cardholder_name
      const cardholderNameSearchParam = cardholderName!.split(' ').join('+')
      const transactionState = TRANSACTION.state?.status.toLowerCase()
      const lastFourDigits = TRANSACTION.card_details?.last_digits_card_number
      const cardBrands = 'visa'

      const ledgerTransactionsParams = {
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        transactions: [TRANSACTION],
        filters: {
          from_date: last12MonthsStartDate,
          reference,
          email,
          cardholder_name: cardholderNameSearchParam,
          payment_states: transactionState,
          last_digits_card_number: lastFourDigits,
          card_brands: cardBrands,
        },
        displaySize: 20,
        transactionLength: 30,
      }

      cy.task('setupStubs', [
        getLedgerTransactionsSuccess({
          ...ledgerTransactionsParams,
          page: 1,
        }),
        getLedgerTransactionsSuccess({
          ...ledgerTransactionsParams,
          page: 2,
        }),
      ])

      cy.visit(
        TRANSACTIONS_LIST_URL +
          `?reference=${reference}&email=${email}&cardholderName=${cardholderNameSearchParam}&lastDigitsCardNumber=${lastFourDigits}&brand=visa&state=success&page=1`
      )

      cy.get('.govuk-pagination__next').first().click()
      cy.get('#reference').invoke('val').should('contain', reference)
      cy.get('#email').invoke('val').should('contain', email)
      cy.get('#cardholderName').invoke('val').should('contain', cardholderName)
      cy.get('#lastDigitsCardNumber').invoke('val').should('contain', lastFourDigits)
      cy.get('#state').invoke('text').should('contain', 'Success')
      cy.get('#card-brand').invoke('text').should('contain', 'Visa')
    })
  })
})
