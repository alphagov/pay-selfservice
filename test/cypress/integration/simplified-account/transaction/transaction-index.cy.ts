import userStubs from '@test/cypress/stubs/user-stubs'
import gatewayAccountStubs from '@test/cypress/stubs/gateway-account-stubs'
import { TransactionFixture } from '@test/fixtures/transaction/transaction.fixture'
import { checkServiceNavigation, checkTitleAndHeading } from '../common/assertions'
import { TEST } from '@models/gateway-account/gateway-account-type'
import { penceToPoundsWithCurrency } from '@utils/currency-formatter'
import { Status } from '@models/transaction/types/status'
import { ResourceType } from '@models/transaction/types/resource-type'
import { TransactionStateFixture } from '@test/fixtures/transaction/transaction-state.fixture'
import { getTransactionsForGatewayAccount } from '@test/cypress/stubs/simplified-account/transaction-stubs'
import { PaymentDetailsFixture } from '@test/fixtures/transaction/payment-details.fixture'
import { getLedgerTransactionsFailure, getLedgerTransactionsSuccess } from '@test/cypress/stubs/transaction-stubs'
import { TimeConstants } from '@utils/time/time-constants'
import { CardDetailsFixture } from '@test/fixtures/card-details/card-details.fixture'
import { LEDGER_TRANSACTION_COUNT_LIMIT } from '@controllers/simplified-account/services/transactions/constants'
import { assertTransactionRow } from '@test/cypress/integration/simplified-account/transaction/utils/assert-transaction-row.assertion'

const TRANSACTION = new TransactionFixture.Payment().toTransactionData()

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
          filters: { from_date: TimeConstants.TWELVE_MONTHS_AGO.toUTC().toISO() },
          displaySize: 20,
        }),
      ])
      cy.visit(TRANSACTIONS_LIST_URL)

      cy.get('.govuk-button--secondary').contains('Download CSV').should('not.exist')
      cy.get('#csv-download').should('contain', 'Filter results to download a CSV of transactions')
      cy.get('[data-cy=pagination-detail]').contains(
        `Over ${LEDGER_TRANSACTION_COUNT_LIMIT.toLocaleString()} transactions`
      )
    })

    it('should display csv download link when results >5k and filters applied', function () {
      cy.task('setupStubs', [
        getLedgerTransactionsSuccess({
          gatewayAccountId: GATEWAY_ACCOUNT_ID,
          transactions: [TRANSACTION],
          transactionLength: 6000,
          filters: { reference: 'unfiltered', from_date: TimeConstants.TWELVE_MONTHS_AGO.toUTC().toISO() },
          displaySize: 20,
        }),
      ])
      cy.visit(TRANSACTIONS_LIST_URL + '?reference=unfiltered')

      cy.get('.govuk-button--secondary').contains('Download CSV').should('exist')
      cy.get('#csv-download').should('not.exist')
      cy.get('[data-cy=pagination-detail]').contains(
        `Over ${LEDGER_TRANSACTION_COUNT_LIMIT.toLocaleString()} transactions`
      )
    })

    it('should not display csv download link or informative text when 0 results', function () {
      cy.task('setupStubs', [getTransactionsForGatewayAccount(GATEWAY_ACCOUNT_ID).success([])])

      cy.visit(TRANSACTIONS_LIST_URL)

      cy.get('.govuk-button--secondary').contains('Download CSV').should('not.exist')
      cy.get('#csv-download').should('not.exist')
    })
  })

  describe('Display', () => {
    const transactionAmounts = { netAmount: 970, fee: 30, amount: 1000 }
    const transactionWithFees = new TransactionFixture.Payment({ ...transactionAmounts }).toTransactionData()

    it('should display card fee with corporate card surcharge transaction', () => {
      sharedStubs('test')
      const transactionAmounts = { corporateCardSurcharge: 25, fee: 15, totalAmount: 1075 }
      const transactionWithCorporateCardSurcharge = new TransactionFixture.Payment({
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
      const stripeTransaction = new TransactionFixture.Payment({ ...transactionAmounts }).toTransactionData()

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
      cy.get('#list-of-sectors-state').invoke('text').should('contain', 'Dispute lost to user')
    })

    it('should display refund transactions correctly', () => {
      sharedStubs('test', 'stripe')

      const state = new TransactionStateFixture({ status: Status.SUCCESS })
      const paymentDetails = new PaymentDetailsFixture({ cardDetails: new CardDetailsFixture({ cardBrand: 'Visa' }) })
      const refundTransaction = new TransactionFixture.Refund({
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
        transactionWithFees.reference!,
        TRANSACTION_URL(transactionWithFees.transaction_id),
        transactionWithFees.email!,
        penceToPoundsWithCurrency(transactionWithFees.amount),
        'Visa',
        'Success'
      )

      assertTransactionRow(
        1,
        refundTransaction.reference!,
        TRANSACTION_URL(transactionWithFees.transaction_id),
        refundTransaction.email!,
        penceToPoundsWithCurrency(refundTransaction.amount),
        'Visa',
        'Refund successful',
        '',
        penceToPoundsWithCurrency(-refundTransaction.amount)
      )
    })

    describe('Disputes', () => {
      it('should display amounts correctly for dispute awaiting evidence', () => {
        sharedStubs('test', 'stripe')

        // const state = new TransactionStateFixture({ status: Status.NEEDS_RESPONSE })
        const paymentDetails = new PaymentDetailsFixture({ cardDetails: new CardDetailsFixture({ cardBrand: 'Visa' }) })
        const disputeTransaction = TransactionFixture.Dispute.NeedsResponse({
          paymentDetails,
        }).toTransactionData()

        cy.task('setupStubs', [
          getTransactionsForGatewayAccount(GATEWAY_ACCOUNT_ID).success([TRANSACTION, disputeTransaction]),
        ])

        cy.visit(TRANSACTIONS_LIST_URL)

        cy.get('.transactions-list--row').should('have.length', 2)

        assertTransactionRow(
          0,
          transactionWithFees.reference!,
          TRANSACTION_URL(transactionWithFees.transaction_id),
          transactionWithFees.email!,
          penceToPoundsWithCurrency(transactionWithFees.amount),
          'Visa',
          'Success'
        )

        assertTransactionRow(
          1,
          disputeTransaction.reference!,
          TRANSACTION_URL(disputeTransaction.transaction_id),
          disputeTransaction.email!,
          penceToPoundsWithCurrency(disputeTransaction.amount),
          'Visa',
          'Dispute awaiting evidence',
          '',
          ''
        )
      })

      it('should display amounts correctly for dispute lost to user', () => {
        sharedStubs('test', 'stripe')
        const transacion = new TransactionFixture.Payment({
          fee: 100,
          netAmount: 900,
        })
        const lostDisputeTransaction = TransactionFixture.Dispute.Lost()

        cy.task('setupStubs', [
          getTransactionsForGatewayAccount(GATEWAY_ACCOUNT_ID).success([
            lostDisputeTransaction.toTransactionData(),
            transacion.toTransactionData(),
          ]),
        ])

        cy.visit(TRANSACTIONS_LIST_URL)

        cy.get('.transactions-list--row').should('have.length', 2)

        assertTransactionRow(
          0,
          lostDisputeTransaction.reference!,
          TRANSACTION_URL(lostDisputeTransaction.externalId),
          lostDisputeTransaction.email!,
          '£10.00',
          'Visa',
          'Dispute lost to user',
          '£20.00',
          '-£30.00'
        )

        assertTransactionRow(
          1,
          transacion.reference,
          TRANSACTION_URL(transacion.externalId),
          transacion.email!,
          '£10.00',
          'Visa',
          'Success'
        )
      })

      it('should display amounts correctly for a dispute won in the service’s favour', () => {
        sharedStubs('test', 'stripe')

        // const state = new TransactionStateFixture({ status: Status.WON })
        const paymentDetails = new PaymentDetailsFixture({ cardDetails: new CardDetailsFixture({ cardBrand: 'Visa' }) })
        const disputeTransaction = TransactionFixture.Dispute.Won({
          paymentDetails,
        }).toTransactionData()

        cy.task('setupStubs', [
          getTransactionsForGatewayAccount(GATEWAY_ACCOUNT_ID).success([TRANSACTION, disputeTransaction]),
        ])

        cy.visit(TRANSACTIONS_LIST_URL)

        cy.get('.transactions-list--row').should('have.length', 2)

        assertTransactionRow(
          0,
          TRANSACTION.reference!,
          TRANSACTION_URL(TRANSACTION.transaction_id),
          TRANSACTION.email!,
          penceToPoundsWithCurrency(TRANSACTION.amount),
          'Visa',
          'Success'
        )

        assertTransactionRow(
          1,
          disputeTransaction.reference!,
          TRANSACTION_URL(disputeTransaction.transaction_id),
          disputeTransaction.email!,
          penceToPoundsWithCurrency(disputeTransaction.amount),
          'Visa',
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
              from_date: TimeConstants.TWELVE_MONTHS_AGO.toUTC().toISO(),
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
              from_date: TimeConstants.TWELVE_MONTHS_AGO.toUTC().toISO(),
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
          filters: { from_date: TimeConstants.TWELVE_MONTHS_AGO.toUTC().toISO() },
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
          filters: { from_date: TimeConstants.TWELVE_MONTHS_AGO.toUTC().toISO() },
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
          filters: { from_date: TimeConstants.TWELVE_MONTHS_AGO.toUTC().toISO() },
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
          filters: { from_date: TimeConstants.TWELVE_MONTHS_AGO.toUTC().toISO() },
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
          from_date: TimeConstants.TWELVE_MONTHS_AGO.toUTC().toISO(),
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
