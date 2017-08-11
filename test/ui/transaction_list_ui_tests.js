'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

var path = require('path')
chai.use(chaiAsPromised)
chai.should()

require(path.join(__dirname, '/../test_helpers/html_assertions.js'))
var renderTemplate = require(path.join(__dirname, '/../test_helpers/html_assertions.js')).render

describe('The transaction list view', function () {
  it('should render all transactions', function () {
    var templateData = {
      'results': [
        {
          'charge_id': 100,
          'email': 'example1@mail.fake',
          'amount': '50.00',
          'reference': 'ref1',
          'state_friendly': 'Testing',
          'state': {
            'status': 'testing',
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
          'state_friendly': 'Testing2',
          'state': {
            'status': 'testing2',
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
        },
        {
          'charge_id': 102,
          'email': 'example3@mail.fake',
          'amount': '20.00',
          'reference': 'ref1',
          'state_friendly': 'Testing2',
          'state': {
            'status': 'testing2',
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
        'transactions_card_type_read': true
      }
    }

    var body = renderTemplate('transactions/index', templateData)

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
  })

  it('should not render amount if no permission', function () {
    var templateData = {
      'results': [
        {
          'charge_id': 100,
          'email': 'example1@mail.fake',
          'amount': '50.00',
          'reference': 'ref1',
          'state_friendly': 'Testing',
          'state': {
            'status': 'testing',
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
          'state_friendly': 'Testing2',
          'state': {
            'status': 'testing2',
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

    var body = renderTemplate('transactions/index', templateData)

    body.should.not.containSelector('#transactions-list .amount')
    body.should.not.containSelector('#amount-header')
  })

  it('should not render email if no permission', function () {
    var templateData = {
      'results': [
        {
          'charge_id': 100,
          'email': 'example1@mail.fake',
          'amount': '50.00',
          'reference': 'ref1',
          'state_friendly': 'Testing',
          'state': {
            'status': 'testing',
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
          'state_friendly': 'Testing2',
          'state': {
            'status': 'testing2',
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

    var body = renderTemplate('transactions/index', templateData)

    body.should.not.containSelector('#transactions-list .email')
    body.should.not.containSelector('#email-header')
  })

  it('should not render card brand if no permission', function () {
    var templateData = {
      'results': [
        {
          'charge_id': 100,
          'email': 'example1@mail.fake',
          'amount': '50.00',
          'reference': 'ref1',
          'state_friendly': 'Testing',
          'state': {
            'status': 'testing',
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
          'state_friendly': 'Testing2',
          'state': {
            'status': 'testing2',
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

    var body = renderTemplate('transactions/index', templateData)

    body.should.not.containSelector('#transactions-list .brand')
    body.should.not.containSelector('#brand-header')
  })
})
