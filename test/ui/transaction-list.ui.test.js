'use strict'

const chai = require('chai')
const path = require('path')

require(path.join(__dirname, '/../test-helpers/html-assertions.js'))
const renderTemplate = require(path.join(__dirname, '/../test-helpers/html-assertions.js')).render
chai.should()

function buildTransaction (chargeId, amount, stateFriendly, status, cardBrand, email, includeCorporateCardSurcharge = false) {
  let transaction = {
    'charge_id': chargeId,
    'email': email,
    'amount': amount,
    'reference': 'ref1',
    'state_friendly': stateFriendly,
    'state': {
      'status': status,
      'finished': false
    },
    'card_details': {
      'billing_address': {
        'city': 'TEST',
        'country': 'GB',
        'line1': 'TEST',
        'line2': 'TEST - DO NOT PROCESS',
        'postcode': 'SE1 3UZ'
      },
      'card_brand': cardBrand,
      'cardholder_name': 'TEST',
      'expiry_date': '12/19',
      'last_digits_card_number': '4242'
    },
    'created': '2016-01-11 01:01:01'
  }

  if (includeCorporateCardSurcharge) {
    transaction.corporate_card_surcharge = 100
    transaction.total_amount = '£21.00'
  }

  return transaction
}

describe('The transaction list view', function () {
  it('should render all transactions', function () {
    const templateData = {
      'results': [
        buildTransaction(100, '£50.00', 'Declined', 'failed', 'Visa', 'example1@mail.fake'),
        buildTransaction(101, '£20.00', 'In progress', 'created', 'Mastercard', 'example2@mail.fake'),
        buildTransaction(102, '£20.00', 'Refund success', 'success', 'Amex', 'example3@mail.fake')
      ],
      permissions: {
        'transactions_email_read': true,
        'transactions_amount_read': true,
        'transactions_card_type_read': true,
        'transactions_download_read': true
      },
      hasResults: true,
      total: 9999,
      showCsvDownload: true,
      totalFormatted: '9,999',
      maxLimitFormatted: '10,000'
    }

    const body = renderTemplate('transactions/index', templateData)

    templateData.results.forEach(function (transactionData, ix) {
      body.should.containSelector('table#transactions-list')
        .havingRowAt(ix + 1)
        .withTableDataAt(1, templateData.results[ix].reference)
        .withTableDataAt(2, templateData.results[ix].email)
        .withTableDataAt(3, templateData.results[ix].amount)
        .withTableDataAt(4, templateData.results[ix].card_details.card_brand)
        .withTableDataAt(5, templateData.results[ix].state_friendly)
        .withTableDataAt(6, templateData.results[ix].created)
    })
    body.should.containSelector('#download-transactions-link')

    body.should.containSelector('.govuk-heading-l').withExactText('Transactions')
    body.should.not.containSelector('.govuk-back-link')
  })

  it('should render relevant sections for `all service transactions`', function () {
    const templateData = {
      'results': [
        buildTransaction(100, '£50.00', 'Declined', 'failed', 'Visa', 'example1@mail.fake')
      ],
      permissions: {
        'transactions_email_read': true,
        'transactions_amount_read': true,
        'transactions_card_type_read': true,
        'transactions_download_read': true
      },
      hasResults: true,
      total: 9999,
      showCsvDownload: true,
      totalFormatted: '9,999',
      maxLimitFormatted: '10,000',
      allServiceTransactions: true
    }

    const body = renderTemplate('transactions/index', templateData)

    templateData.results.forEach(function (transactionData, ix) {
      body.should.containSelector('table#transactions-list')
        .havingRowAt(ix + 1)
        .withTableDataAt(1, templateData.results[ix].reference)
        .withTableDataAt(2, templateData.results[ix].email)
        .withTableDataAt(3, templateData.results[ix].amount)
        .withTableDataAt(4, templateData.results[ix].card_details.card_brand)
        .withTableDataAt(5, templateData.results[ix].state_friendly)
        .withTableDataAt(6, templateData.results[ix].created)
    })
    body.should.containSelector('#download-transactions-link')

    body.should.containSelector('.govuk-back-link')
    body.should.containSelector('.govuk-heading-l').withText('Transactions for all live services')
  })

  it('should render all transactions without download link', function () {
    const templateData = {
      'results': [
        buildTransaction(100, '£50.00', 'Declined', 'failed', 'Visa', 'example1@mail.fake'),
        buildTransaction(101, '£20.00', 'In progress', 'created', 'Mastercard', 'example2@mail.fake'),
        buildTransaction(102, '£20.00', 'Refund success', 'success', 'Amex', 'example3@mail.fake')
      ],
      permissions: {
        'transactions_email_read': true,
        'transactions_amount_read': true,
        'transactions_card_type_read': true,
        'transactions_download_read': true
      },
      hasResults: true,
      total: 10001,
      showCsvDownload: false,
      totalFormatted: '10,001',
      maxLimitFormatted: '10,000'
    }

    const body = renderTemplate('transactions/index', templateData)

    templateData.results.forEach(function (transactionData, ix) {
      body.should.containSelector('table#transactions-list')
        .havingRowAt(ix + 1)
        .withTableDataAt(1, templateData.results[ix].reference)
        .withTableDataAt(2, templateData.results[ix].email)
        .withTableDataAt(3, templateData.results[ix].amount)
        .withTableDataAt(4, templateData.results[ix].card_details.card_brand)
        .withTableDataAt(5, templateData.results[ix].state_friendly)
        .withTableDataAt(6, templateData.results[ix].created)
    })
    body.should.containSelector('p#csv-download').withExactText('Filter results to download a CSV of transactions')
  })

  it('should not render amount if no permission', function () {
    const templateData = {
      'results': [
        buildTransaction(100, '£50.00', 'Success', 'success', 'Visa', 'example1@mail.fake'),
        buildTransaction(101, '£20.00', 'Refund error', 'error', 'Mastercard', 'example2@mail.fake')
      ],
      permissions: {
        'transactions_email_read': true,
        'transactions_card_type_read': true
      }
    }

    const body = renderTemplate('transactions/index', templateData)

    body.should.not.containSelector('#transactions-list .amount')
    body.should.not.containSelector('#amount-header')
  })

  it('should not render email if no permission', function () {
    const templateData = {
      'results': [
        buildTransaction(100, '£50.00', 'Timed out', 'failed', 'Visa', 'example1@mail.fake'),
        buildTransaction(101, '£20.00', 'Success', 'success', 'Mastercard', 'example2@mail.fake')
      ],
      permissions: {
        'transactions_amount_read': true,
        'transactions_card_type_read': true
      }
    }

    const body = renderTemplate('transactions/index', templateData)

    body.should.not.containSelector('#transactions-list .email')
    body.should.not.containSelector('#email-header')
  })

  it('should not render card brand if no permission', function () {
    const templateData = {
      'results': [
        buildTransaction(100, '£50.00', 'Success', 'success', 'Visa', 'example1@mail.fake'),
        buildTransaction(101, '£20.00', 'Success', 'success', 'Mastercard', 'example2@mail.fake')
      ],
      permissions: {
        'transactions_email_read': true,
        'transactions_amount_read': true
      }
    }

    const body = renderTemplate('transactions/index', templateData)

    body.should.not.containSelector('#transactions-list .brand')
    body.should.not.containSelector('#brand-header')
  })

  it('should render all transactions with corporate surcharge', function () {
    const templateData = {
      'results': [
        buildTransaction(102, '£20.00', 'Refund success', 'success', 'Amex', 'example3@mail.fake', true),
        buildTransaction(103, '£20.00', 'Refund success', 'success', 'Amex', 'example3@mail.fake')
      ],
      permissions: {
        'transactions_email_read': true,
        'transactions_amount_read': true,
        'transactions_card_type_read': true,
        'transactions_download_read': true
      },
      hasResults: true,
      total: 1,
      showCsvDownload: true,
      totalFormatted: '1',
      maxLimitFormatted: '10,000'
    }

    const body = renderTemplate('transactions/index', templateData)

    templateData.results.forEach(function (transactionData, ix) {
      body.should.containSelector('table#transactions-list')
        .havingRowAt(ix + 1)
        .withTableDataAt(1, templateData.results[ix].reference)
        .withTableDataAt(2, templateData.results[ix].email)
        .withTableDataTextAt(3, ix === 0 ? '£21.00 (with card fee)' : '£20.00')
        .withTableDataAt(4, templateData.results[ix].card_details.card_brand)
        .withTableDataAt(5, templateData.results[ix].state_friendly)
        .withTableDataAt(6, templateData.results[ix].created)
    })
    body.should.containSelector('#download-transactions-link')
  })
})
