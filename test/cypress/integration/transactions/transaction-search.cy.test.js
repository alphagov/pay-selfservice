const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const stripeAccountSetupStubs = require('../../stubs/stripe-account-setup-stub')
const transactionsStubs = require('../../stubs/transaction-stubs')

const transactionsUrl = `/transactions`
const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
const gatewayAccountId = 42
const serviceName = 'Test Service'

const convertPenceToPoundsFormatted = pence => `£${(pence / 100).toFixed(2)}`

const unfilteredTransactions = [
  {
    reference: 'unfiltered1',
    amount: 1000,
    type: 'payment'
  },
  {
    reference: 'unfiltered2',
    amount: 2000,
    type: 'payment'
  },
  {
    reference: 'unfiltered3',
    amount: 3000,
    corporate_card_surcharge: 250,
    total_amount: 3250,
    type: 'payment'
  }
]

const filteredByDatesTransactions = [
  {
    reference: 'filtered-by-from-date1',
    amount: 1000,
    type: 'payment'
  },
  {
    reference: 'filtered-by-from-date2',
    amount: 1500,
    type: 'payment'
  }
]

const filteredByMultipleFieldsTransactions = [
  {
    transaction_id: 'payment-transaction-id',
    reference: 'filtered-by-multiple-fields',
    amount: 1500,
    type: 'payment',
    card_brand: 'Mastercard'
  },
  {
    amount: 1500,
    reference: 'filtered-by-multiple-fields2',
    type: 'refund',
    includePaymentDetails: true,
    status: 'submitted',
    parent_transaction_id: 'payment-transaction-id2'
  }
]

const transactionsWithAssociatedFees = [
  {
    reference: 'first-transaction-with-fee',
    amount: 3000,
    fee: 300,
    net_amount: 2700,
    type: 'payment',
    payment_provider: 'stripe'
  },
  {
    reference: 'second-transaction-with-fee',
    amount: 5000,
    fee: 500,
    net_amount: 4500,
    type: 'payment',
    payment_provider: 'stripe'
  }
]

const sharedStubs = (paymentProvider = 'sandbox') => {
  return [
    userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceName }),
    gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId, paymentProvider }),
    gatewayAccountStubs.getCardTypesSuccess(),
    stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({ gatewayAccountId })
  ]
}

function assertTransactionRow (row, reference, transactionLink, email, amount, cardBrand, state) {
  cy.get('#transactions-list tbody').find('tr').eq(row).find('th').should('contain', reference)
  cy.get('#transactions-list tbody').find('tr > th').eq(row).find('.reference')
    .should('have.attr', 'href', transactionLink)
  cy.get('#transactions-list tbody').find('tr').eq(row).find('.email').should('contain', email)
  cy.get('#transactions-list tbody').find('tr').eq(row).find('.amount').should('contain', amount)
  cy.get('#transactions-list tbody').find('tr').eq(row).find('.brand').should('contain', cardBrand)
  cy.get('#transactions-list tbody').find('tr').eq(row).find('.state').should('contain', state)
}

describe('Transactions List', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId, gatewayAccountId)
  })

  describe('Filtering', () => {
    it('should display correctly when there are no results', () => {
      cy.task('setupStubs', [
        ...sharedStubs(),
        transactionsStubs.getLedgerTransactionsSuccess({ gatewayAccountId })
      ])
      cy.visit(transactionsUrl)
      cy.get('#transactions-list tbody').should('not.exist')
    })

    it('should display unfiltered results', () => {
      cy.task('setupStubs', [
        ...sharedStubs(),
        transactionsStubs.getLedgerTransactionsSuccess({ gatewayAccountId, transactions: unfilteredTransactions })
      ])
      cy.visit(transactionsUrl)

      // Ensure the transactions list has the right number of items
      cy.get('#transactions-list tbody').find('tr').should('have.length', unfilteredTransactions.length)

      // Ensure the expected transactions are shown
      cy.get('#transactions-list tbody').find('tr').first().find('th').should('contain', unfilteredTransactions[0].reference)
      cy.get('#transactions-list tbody').find('tr').eq(1).find('th').should('contain', unfilteredTransactions[1].reference)
      cy.get('#transactions-list tbody').find('tr').eq(2).find('th').should('contain', unfilteredTransactions[2].reference)
    })

    it('should be able to filter using date-time pickers', () => {
      cy.task('setupStubs', [
        ...sharedStubs(),
        transactionsStubs.getLedgerTransactionsSuccess({
          gatewayAccountId,
          transactions: filteredByDatesTransactions,
          filters: {
            from_date: '2018-05-03T00:00:00.000Z',
            to_date: '2018-05-03T00:00:01.000Z'
          }
        })
      ])

      // 1. Filtering FROM
      // Ensure both the date/time pickers aren't showing
      cy.get('.datepicker').should('not.be.visible')
      cy.get('.ui-timepicker-wrapper').should('not.be.visible')

      // Fill in a from date
      cy.get('#fromDate').type('03/5/2018')

      // Ensure only the datepicker is showing
      cy.get('.datepicker').should('be.visible')
      cy.get('.ui-timepicker-wrapper').should('not.be.visible')

      // Fill in a from time
      cy.get('#fromTime').type('01:00:00')

      // Ensure only the timepicker is showing
      cy.get('.datepicker').should('not.be.visible')
      cy.get('.ui-timepicker-wrapper').should('be.visible')

      // 2. Filtering TO

      // Fill in a to date
      cy.get('#toDate').type('03/5/2018')

      // Ensure only the datepicker is showing
      cy.get('.datepicker').should('be.visible')
      cy.get('.ui-timepicker-wrapper').should('not.be.visible')

      // Fill in a to time
      cy.get('#toTime').type('01:00:00')

      // Ensure only the timepicker is showing
      cy.get('.datepicker').should('not.be.visible')
      cy.get('.ui-timepicker-wrapper').should('be.visible')

      // Click the filter button
      cy.get('#filter').click()

      // Ensure the right number of transactions is displayed
      cy.get('#transactions-list tbody').find('tr').should('have.length', filteredByDatesTransactions.length)

      // Ensure the expected transactions are shown
      cy.get('#transactions-list tbody').find('tr').first().find('th').should('contain', filteredByDatesTransactions[0].reference)
      cy.get('#transactions-list tbody').find('tr').eq(1).find('th').should('contain', filteredByDatesTransactions[1].reference)
    })

    it('should clear filters when "Clear filter" button is clicked', () => {
      cy.task('setupStubs', [
        ...sharedStubs(),
        transactionsStubs.getLedgerTransactionsSuccess({ gatewayAccountId, transactions: [], filters: {} })
      ])
      cy.get('a').contains('Clear filter').click()

      cy.get('#fromDate').should('be.empty')
      cy.get('#fromTime').should('be.empty')
      cy.get('#toDate').should('be.empty')
      cy.get('#toTime').should('be.empty')
    })

    it('should return results when filtering by all fields', () => {
      cy.task('setupStubs', [
        ...sharedStubs(),
        transactionsStubs.getLedgerTransactionsSuccess({
          gatewayAccountId,
          transactions: filteredByMultipleFieldsTransactions,
          filters: {
            reference: 'ref123',
            from_date: '2018-05-03T00:00:00.000Z',
            to_date: '2018-05-04T00:00:01.000Z',
            payment_states: 'created,started,submitted,capturable,success',
            email: 'gds4',
            card_brands: 'visa,master-card',
            last_digits_card_number: '4242',
            cardholder_name: 'doe',
            refund_states: 'submitted'
          }
        })
      ])

      cy.get('#state').click()
      cy.get(`#state .govuk-checkboxes__input[value='Success']`).click()
      cy.get(`#state .govuk-checkboxes__input[value='In progress']`).click()
      cy.get(`#state .govuk-checkboxes__input[value='Refund submitted']`).click()

      cy.get('#reference').type('ref123')
      cy.get('#fromDate').type('03/5/2018')
      cy.get('#fromTime').type('01:00:00')
      cy.get('#toDate').type('04/5/2018')
      cy.get('#toTime').type('01:00:00')
      cy.get('#card-brand').click()
      cy.get(`#card-brand .govuk-checkboxes__input[value=visa]`).click()
      cy.get(`#card-brand .govuk-checkboxes__input[value=master-card]`).click()
      cy.get('#email').type('gds4')
      cy.get('#lastDigitsCardNumber').type('4242')
      cy.get('#cardholderName').type('doe')

      cy.get('#filter').click()

      // Ensure the right number of transactions is displayed
      cy.get('#transactions-list tbody').find('tr').should('have.length', filteredByMultipleFieldsTransactions.length)
      // Ensure the expected transactions are shown
      assertTransactionRow(0, filteredByMultipleFieldsTransactions[0].reference, '/transactions/payment-transaction-id',
        'test2@example.org', '£15.00', 'Mastercard', 'In progress')
      assertTransactionRow(1, filteredByMultipleFieldsTransactions[1].reference, '/transactions/payment-transaction-id2',
        'test@example.org', '–£15.00', 'Visa', 'Refund submitted')
    })
  })
  describe('Transactions are displayed correctly', () => {
    it('should display card fee with corporate card surcharge transaction', () => {
      cy.task('setupStubs', [
        ...sharedStubs(),
        transactionsStubs.getLedgerTransactionsSuccess({ gatewayAccountId, transactions: unfilteredTransactions, transactionLength: 1000 })
      ])
      cy.visit(transactionsUrl)

      // Ensure the transactions list has the right number of items
      cy.get('#transactions-list tbody').find('tr').should('have.length', unfilteredTransactions.length)

      // Ensure the values are displayed correctly
      cy.get('#transactions-list tbody').first().find('td').eq(1).should('have.text', convertPenceToPoundsFormatted(unfilteredTransactions[0].amount))
      cy.get('#transactions-list tbody').find('tr').eq(1).find('td').eq(1).should('have.text', convertPenceToPoundsFormatted(unfilteredTransactions[1].amount))

      // Ensure the card fee is displayed correctly
      cy.get('#transactions-list tbody').find('tr').eq(2).find('td').eq(1).should('contain', convertPenceToPoundsFormatted(unfilteredTransactions[2].total_amount)).and('contain', '(with card fee)')
      cy.get('#download-transactions-link').should('have.attr', 'href', '/transactions/download')
    })

    it('should display the fee and total columns for a stripe gateway with fees', () => {
      cy.task('setupStubs', [
        ...sharedStubs('stripe'),
        transactionsStubs.getLedgerTransactionsSuccess({ gatewayAccountId, transactions: transactionsWithAssociatedFees })
      ])
      cy.visit(transactionsUrl)

      cy.get('#transactions-list tbody').find('tr').should('have.length', transactionsWithAssociatedFees.length)

      cy.get('#transactions-list tbody').find('tr').first().get('[data-cell-type="fee"]').first().should('have.text', convertPenceToPoundsFormatted(transactionsWithAssociatedFees[0].fee))
      cy.get('#transactions-list tbody').find('tr').first().get('[data-cell-type="net"]').first().find('span').should('have.text', convertPenceToPoundsFormatted(transactionsWithAssociatedFees[0].amount - transactionsWithAssociatedFees[0].fee))

      cy.get('#transactions-list tbody').find('tr').first().get('[data-cell-type="fee"]').eq(1).should('have.text', convertPenceToPoundsFormatted(transactionsWithAssociatedFees[1].fee))
      cy.get('#transactions-list tbody').find('tr').first().get('[data-cell-type="net"]').eq(1).find('span').should('have.text', convertPenceToPoundsFormatted(transactionsWithAssociatedFees[1].amount - transactionsWithAssociatedFees[1].fee))
    })
  })
  describe('csv download link', () => {
    it('should not display csv download link when results >5k and no filter applied', function () {
      cy.task('setupStubs', [
        ...sharedStubs(),
        transactionsStubs.getLedgerTransactionsSuccess({ gatewayAccountId, transactions: unfilteredTransactions, transactionLength: 5001 })
      ])
      cy.visit(transactionsUrl)

      cy.get('#download-transactions-link').should('not.exist')
      cy.get('#csv-download').should('contain', 'Filter results to download a CSV of transactions')
    })

    it('should display csv download link when results >5k and filters applied', function () {
      cy.task('setupStubs', [
        ...sharedStubs(),
        transactionsStubs.getLedgerTransactionsSuccess({ gatewayAccountId, transactions: unfilteredTransactions, transactionLength: 10001, filters: { reference: 'unfiltered' } })
      ])
      cy.visit(transactionsUrl + '?reference=unfiltered')

      cy.get('#download-transactions-link').should('exist')
    })
  })
})
