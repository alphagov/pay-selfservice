var path = require('path')

require(path.join(__dirname, '/../test_helpers/html_assertions.js'))
var renderTemplate = require(path.join(__dirname, '/../test_helpers/html_assertions.js')).render

describe('The transaction list view', function () {
  it('should render all transactions', function () {
    var templateData = {
      'total': 2,
      'results': [
        {
          'charge_id': '100',
          'email': 'example1@mail.fake',
          'amount': '50.00',
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
            'card_brand': 'Visa',
            'cardholder_name': 'TEST',
            'expiry_date': '12/19',
            'last_digits_card_number': '4242'
          },
          'created': '2016-01-11 01:01:01'
        },
        {
          'charge_id': '101',
          'email': 'example2@mail.fake',
          'amount': '20.00',
          'reference': 'ref1',
          'state_friendly': 'Testing2',
          'state': {
            'status': 'testing2',
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
        }
      ],
      'filters': {'reference': 'ref1', 'state': 'Testing2', 'brand': 'Visa', 'fromDate': '2015-01-11 01:01:01', 'toDate': '2015-01-11 01:01:01'},
      'hasResults': true,
      'downloadTransactionLink':
                '/transactions/download?reference=ref1&state=Testing2&from_date=2%2F0%2F2015%2001%3A01%3A01&&to_date=2%2F0%2F2015%2001%3A01%3A01',
      permissions: {
        'transactions_amount_read': true,
        'transactions_email_read': true,
        'transactions_card_type_read': true,
        'transactions_download_read': true
      }
    }

    var body = renderTemplate('transactions/index', templateData)

    body.should.containSelector('#download-transactions-link').withAttribute('href', templateData.downloadTransactionLink)

    templateData.results.forEach(function (transactionData, ix) {
      body.should.containSelector('h3#total-results').withExactText('\n  2 transactions\n    from 2015-01-11 01:01:01\n    to 2015-01-11 01:01:01\n    with \'Testing2\' state\n    with \'Visa\' card brand\n')
      body.should.containInputField('reference', 'text').withAttribute('value', 'ref1')
      body.should.containInputField('fromDate', 'text').withAttribute('value', '2015-01-11 01:01:01')
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

  it('should render no transactions', function () {
    var templateData = {
      'results': [],
      'hasResults': false
    }

    var body = renderTemplate('transactions/index', templateData)

    body.should.not.containSelector('#download-transactions-link')

    templateData.results.forEach(function (transactionData, ix) {
      body.should.containSelector('p#no-results').withExactText('No results match the search criteria.')
    })
  })
})
