const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const stripeAccountSetupStubs = require('../../stubs/stripe-account-setup-stub')
const transactionsStubs = require('../../stubs/transaction-stubs')
const transactionStubs = require('../../stubs/transaction-stubs')

const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
const gatewayAccountId = 42
const gatewayAccountExternalId = 'a-valid-external-id'
const serviceName = 'Test Service'
const transactionsUrl = `/account/${gatewayAccountExternalId}/transactions`

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
const transactionWithTotalAmountButNotNetAmount = [
  {
    transaction_id: 'transaction_id',
    reference: 'ref-1',
    amount: 100,
    total_amount: 100,
    type: 'payment'
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

const disputeTransactions = [
  {
    gateway_account_id: gatewayAccountId,
    reference: 'ref1',
    transaction_id: 'transaction-id-1',
    parent_transaction_id: 'parent-transaction-id-1',
    live: true,
    type: 'dispute',
    includePaymentDetails: true,
    status: 'needs_response',
    amount: 2500
  },
  {
    gateway_account_id: gatewayAccountId,
    reference: 'ref2',
    transaction_id: 'transaction-id-2',
    parent_transaction_id: 'parent-transaction-id-2',
    live: true,
    type: 'dispute',
    includePaymentDetails: true,
    status: 'lost',
    amount: 3500,
    net_amount: -5000,
    fee: 1500
  }
]

const sharedStubs = (paymentProvider = 'sandbox') => {
  return [
    userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceName }),
    gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId, paymentProvider, recurringEnabled: true }),
    gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
      gatewayAccountId,
      gatewayAccountExternalId,
      paymentProvider,
      type: 'live',
      recurringEnabled: true
    }),
    gatewayAccountStubs.getCardTypesSuccess(),
    stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({ gatewayAccountId })
  ]
}

function assertTransactionRow (row, reference, transactionLink, email, amount, cardBrand, state, fee, netAmount) {
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

describe('Transactions List', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId)
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

    it('should check if the user has entered a potential PAN into the reference field', () => {
      cy.task('setupStubs', [
        ...sharedStubs(),
        transactionsStubs.getLedgerTransactionsSuccess({ gatewayAccountId })
      ])
      cy.visit(transactionsUrl)

      cy.get('[data-cy=reference-filter]').type('4242424242424242')
      cy.get('[data-cy=email-filter]').click()

      cy.get('[data-cy=reference-filter]').parent().should('have.class', 'govuk-form-group--error')
      cy.get('[data-cy=pan-error]').should('exist')

      cy.get('[data-cy=reference-filter]').clear()
      cy.get('[data-cy=reference-filter]').type('a123456789012345')
      cy.get('[data-cy=email-filter]').click()

      cy.get('[data-cy=reference-filter]').parent().should('not.have.class', 'govuk-form-group--error')
      cy.get('[data-cy=pan-error]').should('not.exist')

      cy.get('[data-cy=reference-filter]').clear()
      cy.get('[data-cy=reference-filter]').type('4444333322221111')
      cy.get('[data-cy=email-filter]').click()

      cy.get('[data-cy=reference-filter]').parent().should('have.class', 'govuk-form-group--error')
      cy.get('[data-cy=pan-error]').should('exist')
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
        transactionsStubs.getLedgerTransactionsSuccess({ gatewayAccountId, transactions: unfilteredTransactions }),
        transactionsStubs.getLedgerTransactionsSuccess({
          gatewayAccountId,
          transactions: filteredByDatesTransactions,
          filters: {
            from_date: '2018-05-03T00:00:00.000Z',
            to_date: '2018-05-03T00:00:01.000Z'
          }
        })
      ])
      cy.visit(transactionsUrl)

      // 1. Filtering FROM
      // Ensure both the date/time pickers aren't showing
      cy.get('.datepicker').should('not.exist')
      cy.get('.ui-timepicker-wrapper').should('not.exist')

      // Fill in a from date
      cy.get('#fromDate').type('03/5/2018')

      // Ensure only the datepicker is showing
      cy.get('.datepicker').should('be.visible')
      cy.get('.ui-timepicker-wrapper').should('not.exist')

      // Fill in a from time
      cy.get('#fromTime').type('01:00:00')

      // Ensure only the timepicker is showing
      cy.get('.datepicker').should('not.exist')
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
      cy.get('.datepicker').should('not.exist')
      cy.get('.ui-timepicker-wrapper').should('be.visible')

      // Click the filter button
      cy.get('#filter').click()

      // Ensure the right number of transactions is displayed
      cy.get('#transactions-list tbody').find('tr').should('have.length', filteredByDatesTransactions.length)

      // Ensure the expected transactions are shown
      cy.get('#transactions-list tbody').find('tr').first().find('th').should('contain', filteredByDatesTransactions[0].reference)
      cy.get('#transactions-list tbody').find('tr').eq(1).find('th').should('contain', filteredByDatesTransactions[1].reference)

      // Ensure filters are cleared when "Clear filter" is clicked
      cy.get('a').contains('Clear filter').click()

      cy.get('#fromDate').should('be.empty')
      cy.get('#fromTime').should('be.empty')
      cy.get('#toDate').should('be.empty')
      cy.get('#toTime').should('be.empty')
    })

    it('should return results when filtering by all fields', () => {
      cy.task('setupStubs', [
        ...sharedStubs(),
        transactionsStubs.getLedgerTransactionsSuccess({ gatewayAccountId, transactions: unfilteredTransactions }),
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
            refund_states: 'submitted',
            metadata_value: 'test',
            agreement_id: 'an-agreement-id'
          }
        })
      ])

      cy.visit(transactionsUrl)
      cy.get('#state').click()
      cy.get(`#list-of-sectors-state .govuk-checkboxes__input[value='Success']`).trigger('mouseover').click()
      cy.get(`#list-of-sectors-state .govuk-checkboxes__input[value='In progress']`).trigger('mouseover').click()
      cy.get(`#list-of-sectors-state .govuk-checkboxes__input[value='Refund submitted']`).trigger('mouseover').click()

      cy.get('#reference').type('ref123')
      cy.get('#fromDate').type('03/5/2018')
      cy.get('#fromTime').type('01:00:00')
      cy.get('#toDate').type('04/5/2018')
      cy.get('#toTime').type('01:00:00')
      cy.get('#card-brand').click()
      cy.get(`#list-of-sectors-brand .govuk-checkboxes__input[value=visa]`).click()
      cy.get(`#list-of-sectors-brand .govuk-checkboxes__input[value=master-card]`).click()
      cy.get('#email').type('gds4')
      cy.get('#lastDigitsCardNumber').type('4242')
      cy.get('#cardholderName').type('doe')

      cy.contains('Advanced filters').click()
      cy.get('#metadataValue').type('test')
      cy.get('#agreementId').type('an-agreement-id')
      cy.get('#filter').click()

      // Ensure the right number of transactions is displayed
      cy.get('#transactions-list tbody').find('tr').should('have.length', filteredByMultipleFieldsTransactions.length)
      // Ensure the expected transactions are shown
      assertTransactionRow(0, filteredByMultipleFieldsTransactions[0].reference, `/account/${gatewayAccountExternalId}/transactions/payment-transaction-id`,
        'test2@example.org', '£15.00', 'Mastercard', 'In progress')
      assertTransactionRow(1, filteredByMultipleFieldsTransactions[1].reference, `/account/${gatewayAccountExternalId}/transactions/payment-transaction-id2`,
        'test@example.org', '–£15.00', 'Visa', 'Refund submitted')
    })
  })
  describe('Transactions are displayed correctly', () => {
    it('should display card fee with corporate card surcharge transaction', () => {
      cy.task('setupStubs', [
        ...sharedStubs(),
        transactionsStubs.getLedgerTransactionsSuccess({
          gatewayAccountId,
          transactions: unfilteredTransactions,
          transactionLength: 1000
        })
      ])
      cy.visit(transactionsUrl)

      // Ensure the transactions list has the right number of items
      cy.get('#transactions-list tbody').find('tr').should('have.length', unfilteredTransactions.length)

      // Ensure the values are displayed correctly
      cy.get('#transactions-list tbody').first().find('td').eq(1).should('have.text', convertPenceToPoundsFormatted(unfilteredTransactions[0].amount))
      cy.get('#transactions-list tbody').find('tr').eq(1).find('td').eq(1).should('have.text', convertPenceToPoundsFormatted(unfilteredTransactions[1].amount))

      // Ensure the card fee is displayed correctly
      cy.get('#transactions-list tbody').find('tr').eq(2).find('td').eq(1).should('contain', convertPenceToPoundsFormatted(unfilteredTransactions[2].total_amount)).and('contain', '(with card fee)')
      cy.get('#download-transactions-link').should('have.attr', 'href', `/account/${gatewayAccountExternalId}/transactions/download`)
    })

    it('should display the fee and total columns for a stripe gateway with fees', () => {
      cy.task('setupStubs', [
        ...sharedStubs('stripe'),
        transactionsStubs.getLedgerTransactionsSuccess({
          gatewayAccountId,
          transactions: transactionsWithAssociatedFees
        })
      ])
      cy.visit(transactionsUrl)

      cy.get('#transactions-list tbody').find('tr').should('have.length', transactionsWithAssociatedFees.length)

      cy.get('#transactions-list tbody').find('tr').first().get('[data-cell-type="fee"]').first().should('have.text', convertPenceToPoundsFormatted(transactionsWithAssociatedFees[0].fee))
      cy.get('#transactions-list tbody').find('tr').first().get('[data-cell-type="net"]').first().find('span').should('have.text', convertPenceToPoundsFormatted(transactionsWithAssociatedFees[0].amount - transactionsWithAssociatedFees[0].fee))

      cy.get('#transactions-list tbody').find('tr').first().get('[data-cell-type="fee"]').eq(1).should('have.text', convertPenceToPoundsFormatted(transactionsWithAssociatedFees[1].fee))
      cy.get('#transactions-list tbody').find('tr').first().get('[data-cell-type="net"]').eq(1).find('span').should('have.text', convertPenceToPoundsFormatted(transactionsWithAssociatedFees[1].amount - transactionsWithAssociatedFees[1].fee))
    })
    it('should display net amount correctly for stripe transaction with total amount but not net amount set', () => {
      cy.task('setupStubs', [
        ...sharedStubs('stripe'),
        transactionsStubs.getLedgerTransactionsSuccess({
          gatewayAccountId,
          transactions: transactionWithTotalAmountButNotNetAmount
        })
      ])
      cy.visit(transactionsUrl)
      cy.get('#transactions-list tbody').find('tr').first().get('[data-cell-type="net"]').eq(0).find('span').should('have.text', convertPenceToPoundsFormatted(transactionWithTotalAmountButNotNetAmount[0].total_amount))
    })

    it('should display dispute statuses in the dropdown and dispute transactions correctly - when enabled', () => {
      cy.setEncryptedCookies(userExternalId)
      cy.task('setupStubs', [
        ...sharedStubs('stripe'),
        transactionsStubs.getLedgerTransactionsSuccess({
          gatewayAccountId,
          transactions: []
        }),
        transactionStubs.getLedgerTransactionsSuccess({
          gatewayAccountId,
          transactions: disputeTransactions,
          filters: {
            dispute_states: 'needs_response,under_review'
          }
        })
      ])

      cy.visit(transactionsUrl)

      cy.get('#list-of-sectors-state').invoke('text').should('contain', 'Dispute awaiting evidence')
      cy.get('#list-of-sectors-state').invoke('text').should('contain', 'Dispute under review')
      cy.get('#list-of-sectors-state').invoke('text').should('contain', 'Dispute won in your favour')
      cy.get('#list-of-sectors-state').invoke('text').should('contain', 'Dispute lost to customer')

      cy.get('#state').click()
      cy.get(`#list-of-sectors-state .govuk-checkboxes__input[value='Dispute awaiting evidence']`).trigger('mouseover').click()
      cy.get(`#list-of-sectors-state .govuk-checkboxes__input[value='Dispute under review']`).trigger('mouseover').click()

      cy.get('#filter').click()
      cy.get('.transactions-list--row').should('have.length', 2)
      cy.get('#charge-id-parent-transaction-id-1').should('exist')
      cy.get('#charge-id-parent-transaction-id-2').should('exist')

      assertTransactionRow(0, disputeTransactions[0].reference, `/account/a-valid-external-id/transactions/parent-transaction-id-1`,
        'test@example.org', '–£25.00', 'Visa', 'Dispute awaiting evidence', '', '')
      assertTransactionRow(1, disputeTransactions[1].reference, `/account/a-valid-external-id/transactions/parent-transaction-id-2`,
        'test@example.org', '–£35.00', 'Visa', 'Dispute lost to customer', '£15.00', '-£50.00')

      cy.get('#download-transactions-link').should('have.attr', 'href', `/account/a-valid-external-id/transactions/download?dispute_states=needs_response&dispute_states=under_review`)
    })
  })

  describe('csv download link', () => {
    it('should not display csv download link when results >5k and no filter applied', function () {
      cy.task('setupStubs', [
        ...sharedStubs(),
        transactionsStubs.getLedgerTransactionsSuccess({
          gatewayAccountId,
          transactions: unfilteredTransactions,
          transactionLength: 5001
        })
      ])
      cy.visit(transactionsUrl)

      cy.get('#download-transactions-link').should('not.exist')
      cy.get('#csv-download').should('contain', 'Filter results to download a CSV of transactions')
    })

    it('should display csv download link when results >5k and filters applied', function () {
      cy.task('setupStubs', [
        ...sharedStubs(),
        transactionsStubs.getLedgerTransactionsSuccess({
          gatewayAccountId,
          transactions: unfilteredTransactions,
          transactionLength: 10001,
          filters: { reference: 'unfiltered' }
        })
      ])
      cy.visit(transactionsUrl + '?reference=unfiltered')

      cy.get('#download-transactions-link').should('exist')
    })
  })

  describe('Should display relevant error page on search failure ', () => {
    it('should show error message on a bad request while retrieving the list of transactions', () => {
      cy.task('setupStubs', [
        ...sharedStubs(),
        transactionsStubs.getLedgerTransactionsSuccess({ gatewayAccountId, transactions: unfilteredTransactions })
      ])
      cy.visit(transactionsUrl, { failOnStatusCode: false })

      cy.task('clearStubs')

      cy.task('setupStubs', [
        ...sharedStubs(),
        transactionsStubs.getLedgerTransactionsFailure(
          {
            account_id: gatewayAccountId,
            limit_total: 'true',
            limit_total_size: '5001',
            from_date: '',
            to_date: '',
            page: '1',
            display_size: '100'
          },
          400)
      ])

      // Click the filter button
      cy.get('#filter').click()

      // Ensure that transaction list is not displayed
      cy.get('#transactions-list tbody').should('not.exist')

      // Ensure an error message header is displayed
      cy.get('h1').contains('An error occurred')

      // Ensure a generic error message is displayed
      cy.get('#errorMsg').contains('Unable to retrieve list of transactions or card types')
    })
    it('should display the generic error page, if an internal server error occurs while retrieving the list of transactions', () => {
      cy.task('setupStubs', [
        ...sharedStubs(),
        transactionsStubs.getLedgerTransactionsSuccess({ gatewayAccountId, transactions: unfilteredTransactions })
      ])
      cy.visit(transactionsUrl, { failOnStatusCode: false })

      // 1. Filtering FROM
      // Ensure both the date/time pickers aren't showing
      cy.get('.datepicker').should('not.exist')
      cy.get('.ui-timepicker-wrapper').should('not.exist')

      // Fill in a from date
      cy.get('#fromDate').type('03/5/2018')

      // Fill in a from time
      cy.get('#fromTime').type('01:00:00')

      // 2. Filtering TO

      // Fill in a to date
      cy.get('#toDate').type('03/5/2023')

      // Fill in a to time
      cy.get('#toTime').type('01:00:00')

      cy.task('clearStubs')

      cy.task('setupStubs', [
        ...sharedStubs(),
        transactionsStubs.getLedgerTransactionsFailure(
          {
            account_id: gatewayAccountId,
            limit_total: 'true',
            limit_total_size: '5001',
            from_date: '2018-05-03T00:00:00.000Z',
            to_date: '2023-05-03T00:00:01.000Z',
            page: '1',
            display_size: '100'
          },
          500)
      ])

      // Click the filter button
      cy.get('#filter').click()

      // Ensure that transaction list is not displayed
      cy.get('#transactions-list tbody').should('not.exist')

      // Ensure an error message header is displayed
      cy.get('h1').contains('An error occurred')

      // Ensure a generic error message is displayed
      cy.get('#errorMsg').contains('Unable to retrieve list of transactions or card types')
    })

    it('should display the gateway timeout error page, if a gateway timeout error occurs while retrieving the list of transactions', () => {
      cy.task('setupStubs', [
        ...sharedStubs(),
        transactionsStubs.getLedgerTransactionsSuccess({ gatewayAccountId, transactions: unfilteredTransactions })
      ])
      cy.visit(transactionsUrl, { failOnStatusCode: false })

      // 1. Filtering FROM
      // Ensure both the date/time pickers aren't showing
      cy.get('.datepicker').should('not.exist')
      cy.get('.ui-timepicker-wrapper').should('not.exist')

      // Fill in a from date
      cy.get('#fromDate').type('03/5/2018')

      // Fill in a from time
      cy.get('#fromTime').type('01:00:00')

      // 2. Filtering TO

      // Fill in a to date
      cy.get('#toDate').type('03/5/2023')

      // Fill in a to time
      cy.get('#toTime').type('01:00:00')

      cy.task('clearStubs')

      cy.task('setupStubs', [
        ...sharedStubs(),
        transactionsStubs.getLedgerTransactionsFailure(
          {
            account_id: gatewayAccountId,
            limit_total: 'true',
            limit_total_size: '5001',
            from_date: '2018-05-03T00:00:00.000Z',
            to_date: '2023-05-03T00:00:01.000Z',
            page: '1',
            display_size: '100'
          },
          504)
      ])

      // Click the filter button
      cy.get('#filter').click()

      // Ensure that transaction list is not displayed
      cy.get('#transactions-list tbody').should('not.exist')

      // Ensure an error message header is displayed
      cy.get('h1').contains('An error occurred')

      // Ensure a gateway timeout error message is displayed
      cy.get('#errorMsg').contains('Your request has timed out. Please apply more filters and try again')
    })
  })
})
