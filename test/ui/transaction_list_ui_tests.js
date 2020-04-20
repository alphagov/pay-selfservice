'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const path = require('path')
chai.use(chaiAsPromised)
chai.should()

require(path.join(__dirname, '/../test_helpers/html_assertions.js'))
const renderTemplate = require(path.join(__dirname, '/../test_helpers/html_assertions.js')).render

describe('The transaction list view', function () {
  it('should render all transactions', function () {
    const templateData = {
      'results': [
        {
          'charge_id': 100,
          'email': 'example1@mail.fake',
          'amount': '50.00',
          'reference': 'ref1',
          'state_friendly': 'Declined',
          'state': {
            'status': 'failed',
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
            'card_brand': 'Visa',
            'cardholder_name': 'TEST',
            'expiry_date': '12/19',
            'last_digits_card_number': '4242'
          },
          'created': '2016-01-11 01:01:01'
        },
        {
          'charge_id': 101,
          'email': 'example2@mail.fake',
          'amount': '20.00',
          'reference': 'ref1',
          'state_friendly': 'In progress',
          'state': {
            'status': 'created',
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
            'card_brand': 'Mastercard',
            'cardholder_name': 'TEST',
            'expiry_date': '12/19',
            'last_digits_card_number': '4242'
          },
          'created': '2016-01-11 01:01:01'
        },
        {
          'charge_id': 102,
          'email': 'example3@mail.fake',
          'amount': '20.00',
          'reference': 'ref1',
          'state_friendly': 'Refund success',
          'state': {
            'status': 'success',
            'finished': true
          },
          'card_details': {
            'billing_address': {
              'city': 'TEST',
              'country': 'GB',
              'line1': 'TEST',
              'line2': 'TEST - DO NOT PROCESS',
              'postcode': 'SE1 3UZ'
            },
            'card_brand': 'Amex',
            'cardholder_name': 'TEST',
            'expiry_date': '12/19',
            'last_digits_card_number': '4242'
          },
          'created': '2016-01-11 01:01:01'
        }
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
      csvMaxLimitFormatted: '10,000'
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
  })

  it('should render all transactions without download link', function () {
    const templateData = {
      'results': [
        {
          'charge_id': 100,
          'email': 'example1@mail.fake',
          'amount': '50.00',
          'reference': 'ref1',
          'state_friendly': 'Declined',
          'state': {
            'status': 'failed',
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
            'card_brand': 'Visa',
            'cardholder_name': 'TEST',
            'expiry_date': '12/19',
            'last_digits_card_number': '4242'
          },
          'created': '2016-01-11 01:01:01'
        },
        {
          'charge_id': 101,
          'email': 'example2@mail.fake',
          'amount': '20.00',
          'reference': 'ref1',
          'state_friendly': 'In progress',
          'state': {
            'status': 'created',
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
            'card_brand': 'Mastercard',
            'cardholder_name': 'TEST',
            'expiry_date': '12/19',
            'last_digits_card_number': '4242'
          },
          'created': '2016-01-11 01:01:01'
        },
        {
          'charge_id': 102,
          'email': 'example3@mail.fake',
          'amount': '20.00',
          'reference': 'ref1',
          'state_friendly': 'Refund success',
          'state': {
            'status': 'success',
            'finished': true
          },
          'card_details': {
            'billing_address': {
              'city': 'TEST',
              'country': 'GB',
              'line1': 'TEST',
              'line2': 'TEST - DO NOT PROCESS',
              'postcode': 'SE1 3UZ'
            },
            'card_brand': 'Amex',
            'cardholder_name': 'TEST',
            'expiry_date': '12/19',
            'last_digits_card_number': '4242'
          },
          'created': '2016-01-11 01:01:01'
        }
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
      csvMaxLimitFormatted: '10,000'
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
    body.should.containSelector('p#csv-download').withExactText('You cannot download CSV over 10,000 transactions. Please refine your search')
  })

  it('should not render amount if no permission', function () {
    const templateData = {
      'results': [
        {
          'charge_id': 100,
          'email': 'example1@mail.fake',
          'amount': '50.00',
          'reference': 'ref1',
          'state_friendly': 'Success',
          'state': {
            'status': 'success',
            'finished': true
          },
          'card_details': {
            'billing_address': {
              'city': 'TEST',
              'country': 'GB',
              'line1': 'TEST',
              'line2': 'TEST - DO NOT PROCESS',
              'postcode': 'SE1 3UZ'
            },
            'card_brand': 'Visa',
            'cardholder_name': 'TEST',
            'expiry_date': '12/19',
            'last_digits_card_number': '4242'
          },
          'created': '2016-01-11 01:01:01'
        },
        {
          'charge_id': 101,
          'email': 'example2@mail.fake',
          'amount': '20.00',
          'reference': 'ref1',
          'state_friendly': 'Refund error',
          'state': {
            'status': 'error',
            'finished': true
          },
          'card_details': {
            'billing_address': {
              'city': 'TEST',
              'country': 'GB',
              'line1': 'TEST',
              'line2': 'TEST - DO NOT PROCESS',
              'postcode': 'SE1 3UZ'
            },
            'card_brand': 'Mastercard',
            'cardholder_name': 'TEST',
            'expiry_date': '12/19',
            'last_digits_card_number': '4242'
          },
          'created': '2016-01-11 01:01:01'
        }
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
        {
          'charge_id': 100,
          'email': 'example1@mail.fake',
          'amount': '50.00',
          'reference': 'ref1',
          'state_friendly': 'Timed out',
          'state': {
            'status': 'failed',
            'finished': true
          },
          'card_details': {
            'billing_address': {
              'city': 'TEST',
              'country': 'GB',
              'line1': 'TEST',
              'line2': 'TEST - DO NOT PROCESS',
              'postcode': 'SE1 3UZ'
            },
            'card_brand': 'Visa',
            'cardholder_name': 'TEST',
            'expiry_date': '12/19',
            'last_digits_card_number': '4242'
          },
          'created': '2016-01-11 01:01:01'
        },
        {
          'charge_id': 101,
          'email': 'example2@mail.fake',
          'amount': '20.00',
          'reference': 'ref1',
          'state_friendly': 'Success',
          'state': {
            'status': 'success',
            'finished': true
          },
          'card_details': {
            'billing_address': {
              'city': 'TEST',
              'country': 'GB',
              'line1': 'TEST',
              'line2': 'TEST - DO NOT PROCESS',
              'postcode': 'SE1 3UZ'
            },
            'card_brand': 'Mastercard',
            'cardholder_name': 'TEST',
            'expiry_date': '12/19',
            'last_digits_card_number': '4242'
          },
          'created': '2016-01-11 01:01:01'
        }
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
        {
          'charge_id': 100,
          'email': 'example1@mail.fake',
          'amount': '50.00',
          'reference': 'ref1',
          'state_friendly': 'Success',
          'state': {
            'status': 'success',
            'finished': true
          },
          'card_details': {
            'billing_address': {
              'city': 'TEST',
              'country': 'GB',
              'line1': 'TEST',
              'line2': 'TEST - DO NOT PROCESS',
              'postcode': 'SE1 3UZ'
            },
            'card_brand': 'Visa',
            'cardholder_name': 'TEST',
            'expiry_date': '12/19',
            'last_digits_card_number': '4242'
          },
          'created': '2016-01-11 01:01:01'
        },
        {
          'charge_id': 101,
          'email': 'example2@mail.fake',
          'amount': '20.00',
          'reference': 'ref1',
          'state_friendly': 'Success',
          'state': {
            'status': 'success',
            'finished': true
          },
          'card_details': {
            'billing_address': {
              'city': 'TEST',
              'country': 'GB',
              'line1': 'TEST',
              'line2': 'TEST - DO NOT PROCESS',
              'postcode': 'SE1 3UZ'
            },
            'card_brand': 'Mastercard',
            'cardholder_name': 'TEST',
            'expiry_date': '12/19',
            'last_digits_card_number': '4242'
          },
          'created': '2016-01-11 01:01:01'
        }
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
        {
          'charge_id': 102,
          'email': 'example3@mail.fake',
          'amount': '20.00',
          'reference': 'ref1',
          'state_friendly': 'Refund success',
          'state': {
            'status': 'success',
            'finished': true
          },
          'card_details': {
            'billing_address': {
              'city': 'TEST',
              'country': 'GB',
              'line1': 'TEST',
              'line2': 'TEST - DO NOT PROCESS',
              'postcode': 'SE1 3UZ'
            },
            'card_brand': 'Amex',
            'cardholder_name': 'TEST',
            'expiry_date': '12/19',
            'last_digits_card_number': '4242'
          },
          'created': '2016-01-11 01:01:01',
          'corporate_card_surcharge': 100,
          'total_amount': '£21.00'
        },
        {
          'charge_id': 103,
          'email': 'example3@mail.fake',
          'amount': '£20.00',
          'reference': 'ref1',
          'state_friendly': 'Refund success',
          'state': {
            'status': 'success',
            'finished': true
          },
          'card_details': {
            'billing_address': {
              'city': 'TEST',
              'country': 'GB',
              'line1': 'TEST',
              'line2': 'TEST - DO NOT PROCESS',
              'postcode': 'SE1 3UZ'
            },
            'card_brand': 'Amex',
            'cardholder_name': 'TEST',
            'expiry_date': '12/19',
            'last_digits_card_number': '4242'
          },
          'created': '2016-01-11 01:01:01'
        }
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
      csvMaxLimitFormatted: '10,000'
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
