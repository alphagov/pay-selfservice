let path = require('path')
let cheerio = require('cheerio')

require(path.join(__dirname, '/../test_helpers/html_assertions.js'))
let renderTemplate = require(path.join(__dirname, '/../test_helpers/test_renderer.js')).render

describe('The transaction details view', function () {
  it('should render transaction details when payment does not have card details', function () {
    let templateData = {
      'reference': '<123412341234> &',
      'email': 'alice.111@mail.fake',
      'indexFilters': 'reference=&email=&state=&fromDate=&fromTime=&toDate=&toTime=',
      'amount': '£10.00',
      'gateway_account_id': '1',
      'refundable': false,
      'refunded': false,
      'charge_id': '1',
      'description': 'First ever',
      'state': {
        'status': 'success',
        'finished': true
      },
      'card_details': {
        'card_brand': 'Data unavailable',
        'cardholder_name': 'Data unavailable',
        'expiry_date': 'Data unavailable',
        'last_digits_card_number': '****'
      },
      'state_friendly': 'Success',
      'gateway_transaction_id': '938c54a7-4186-4506-bfbe-72a122da6528',
      'events': [
        {
          'chargeId': 1,
          'state:': {'status': 'started', 'finished': false},
          'state_friendly': 'User started payment of AMOUNT',
          'updated': '2015-12-24 13:21:05',
          'updated_friendly': '24 January 2015 13:21:05'
        },
        {
          'chargeId': 1,
          'state:': {'status': 'created', 'finished': false},
          'state_friendly': 'Service created payment of £10.00',
          'updated': '2015-12-24 13:21:05',
          'updated_friendly': '24 January 2015 13:21:05'
        }
      ],
      permissions: {
        'transactions_amount_read': true,
        'transactions_email_read': true,
        'transactions_card_type_read': true,
        'transactions_description_read': true,
        'transactions_events_read': true
      }
    }

    let body = renderTemplate('transaction_detail/index', templateData)
    let $ = cheerio.load(body)
    body.should.not.containSelector('#show-refund')
    body.should.not.containSelector('#refunded-amount')
    $('#arrowed').attr('href').should.equal('?reference=&email=&state=&fromDate=&fromTime=&toDate=&toTime=')
    $('#reference').html().should.equal('&lt;123412341234&gt; &amp;')
    $('#description').html().should.equal('First ever')
    $('#email').html().should.equal('alice.111@mail.fake')
    $('#amount').text().should.equal(templateData.amount)
    $('#payment-id').text().should.equal(templateData.charge_id)
    $('#transaction-id').text().should.equal(templateData.gateway_transaction_id)
    $('#refunded').text().should.equal('✖')
    $('#state').text().should.equal(templateData.state_friendly)
    $('#brand').text().should.equal('Data unavailable')
    $('#cardholder_name').text().should.equal('Data unavailable')
    $('#card_number').text().should.equal('**** **** **** ****')
    $('#card_expiry_date').text().should.equal('Data unavailable')

    templateData.events.forEach(function (transactionData, ix) {
      body.should.containSelector('table.transaction-events')
          .havingRowAt(ix + 1)
          .withTableDataAt(1, templateData.events[ix].state_friendly)
          .withTableDataAt(2, templateData.events[ix].updated_friendly)
    })
  })

  it('should render transaction details when payment is not refundable', function () {
    let templateData = {
      'reference': '<123412341234> &',
      'email': 'alice.111@mail.fake',
      'indexFilters': 'reference=&email=&state=&fromDate=&fromTime=&toDate=&toTime=',
      'amount': '£10.00',
      'gateway_account_id': '1',
      'refundable': false,
      'refunded': false,
      'charge_id': '1',
      'description': 'First ever',
      'state': {
        'status': 'success',
        'finished': true
      },
      'card_brand': 'Visa',
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
      'state_friendly': 'Success',
      'gateway_transaction_id': '938c54a7-4186-4506-bfbe-72a122da6528',
      'events': [
        {
          'chargeId': 1,
          'state:': {'status': 'success', 'finished': true},
          'state_friendly': 'Payment of £10.00 succeeded',
          'updated': '2015-12-24 13:21:05',
          'updated_friendly': '24 January 2015 13:21:05'
        },

        {
          'chargeId': 1,
          'state:': {'status': 'submitted', 'finished': false},
          'state_friendly': 'User submitted payment details for payment of £10.00',
          'updated': '2015-12-24 13:21:05',
          'updated_friendly': '24 January 2015 13:21:05'
        },

        {
          'chargeId': 1,
          'state:': {'status': 'started', 'finished': false},
          'state_friendly': 'User started payment of AMOUNT',
          'updated': '2015-12-24 13:21:05',
          'updated_friendly': '24 January 2015 13:21:05'
        },

        {
          'chargeId': 1,
          'state:': {'status': 'created', 'finished': false},
          'state_friendly': 'Service created payment of £10.00',
          'updated': '2015-12-24 13:21:05',
          'updated_friendly': '24 January 2015 13:21:05'
        }
      ],
      permissions: {
        'transactions_amount_read': true,
        'transactions_email_read': true,
        'transactions_card_type_read': true,
        'transactions_description_read': true,
        'transactions_events_read': true
      }
    }

    let body = renderTemplate('transaction_detail/index', templateData)
    let $ = cheerio.load(body)
    body.should.not.containSelector('#show-refund')
    body.should.not.containSelector('#refunded-amount')
    $('#arrowed').attr('href').should.equal('?reference=&email=&state=&fromDate=&fromTime=&toDate=&toTime=')
    $('#reference').html().should.equal('&lt;123412341234&gt; &amp;')
    $('#description').html().should.equal('First ever')
    $('#email').html().should.equal('alice.111@mail.fake')
    $('#amount').text().should.equal(templateData.amount)
    $('#payment-id').text().should.equal(templateData.charge_id)
    $('#transaction-id').text().should.equal(templateData.gateway_transaction_id)
    $('#refunded').text().should.equal('✖')
    $('#state').text().should.equal(templateData.state_friendly)
    $('#brand').text().should.equal(templateData.card_brand)
    $('#cardholder_name').text().should.equal(templateData.card_details.cardholder_name)
    $('#card_number').text().should.equal('**** **** **** ' + templateData.card_details.last_digits_card_number)
    $('#card_expiry_date').text().should.equal(templateData.card_details.expiry_date)

    templateData.events.forEach(function (transactionData, ix) {
      body.should.containSelector('table.transaction-events')
          .havingRowAt(ix + 1)
          .withTableDataAt(1, templateData.events[ix].state_friendly)
          .withTableDataAt(2, templateData.events[ix].updated_friendly)
    })
  })

  it('should render transaction details when payment has been refunded', function () {
    let templateData = {
      'reference': '<123412341234> &',
      'email': 'alice.111@mail.fake',
      'amount': '£10.00',
      'gateway_account_id': '1',
      'refundable': true,
      'refunded': true,
      'refunded_amount': '£5.00',
      'charge_id': '1',
      'description': 'First ever',
      'state': {
        'status': 'success',
        'finished': true
      },
      'card_brand': 'Visa',
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
      'state_friendly': 'Success',
      'gateway_transaction_id': '938c54a7-4186-4506-bfbe-72a122da6528',
      'events': [
        {
          'chargeId': 1,
          'state:': {'status': 'success', 'finished': true},
          'state_friendly': 'Payment of £10.00 succeeded',
          'updated': '2015-12-24 13:21:05',
          'updated_friendly': '24 January 2015 13:21:05'
        },

        {
          'chargeId': 1,
          'state:': {'status': 'submitted', 'finished': false},
          'state_friendly': 'User submitted payment details for payment of £10.00',
          'updated': '2015-12-24 13:21:05',
          'updated_friendly': '24 January 2015 13:21:05'
        },

        {
          'chargeId': 1,
          'state:': {'status': 'started', 'finished': false},
          'state_friendly': 'User started payment of AMOUNT',
          'updated': '2015-12-24 13:21:05',
          'updated_friendly': '24 January 2015 13:21:05'
        },

        {
          'chargeId': 1,
          'state:': {'status': 'created', 'finished': false},
          'state_friendly': 'Service created payment of £10.00',
          'updated': '2015-12-24 13:21:05',
          'updated_friendly': '24 January 2015 13:21:05'
        }
      ],
      permissions: {
        'transactions_amount_read': true,
        'transactions_email_read': true,
        'transactions_card_type_read': true,
        'transactions_description_read': true,
        'transactions_events_read': true
      }
    }

    let body = renderTemplate('transaction_detail/index', templateData)
    let $ = cheerio.load(body)
    body.should.containSelector('#show-refund')
    $('#reference').html().should.equal('&lt;123412341234&gt; &amp;')
    $('#description').html().should.equal('First ever')
    $('#email').html().should.equal('alice.111@mail.fake')
    $('#amount').text().should.equal(templateData.amount)
    $('#payment-id').text().should.equal(templateData.charge_id)
    $('#transaction-id').text().should.equal(templateData.gateway_transaction_id)
    $('#refunded').text().should.equal('✔')
    $('#refunded-amount').text().should.equal('£5.00')
    $('#state').text().should.equal(templateData.state_friendly)
    $('#brand').text().should.equal(templateData.card_brand)
    $('#cardholder_name').text().should.equal(templateData.card_details.cardholder_name)
    $('#card_number').text().should.equal('**** **** **** ' + templateData.card_details.last_digits_card_number)
    $('#card_expiry_date').text().should.equal(templateData.card_details.expiry_date)

    templateData.events.forEach(function (transactionData, ix) {
      body.should.containSelector('table.transaction-events')
          .havingRowAt(ix + 1)
          .withTableDataAt(1, templateData.events[ix].state_friendly)
          .withTableDataAt(2, templateData.events[ix].updated_friendly)
    })
  })

  it('should not render transaction amount if no permission', function () {
    let templateData = {
      'reference': '<123412341234> &',
      'email': 'alice.111@mail.fake',
      'amount': '£10.00',
      'gateway_account_id': '1',
      'refundable': true,
      'refunded': true,
      'refunded_amount': '£5.00',
      'charge_id': '1',
      'description': 'First ever',
      'state': {
        'status': 'success',
        'finished': true
      },
      'card_brand': 'Visa',
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
      'state_friendly': 'Success',
      'gateway_transaction_id': '938c54a7-4186-4506-bfbe-72a122da6528',
      'events': [
        {
          'chargeId': 1,
          'state:': {'status': 'success', 'finished': true},
          'state_friendly': 'Payment of £10.00 succeeded',
          'updated': '2015-12-24 13:21:05',
          'updated_friendly': '24 January 2015 13:21:05'
        },

        {
          'chargeId': 1,
          'state:': {'status': 'submitted', 'finished': false},
          'state_friendly': 'User submitted payment details for payment of £10.00',
          'updated': '2015-12-24 13:21:05',
          'updated_friendly': '24 January 2015 13:21:05'
        },

        {
          'chargeId': 1,
          'state:': {'status': 'started', 'finished': false},
          'state_friendly': 'User started payment of AMOUNT',
          'updated': '2015-12-24 13:21:05',
          'updated_friendly': '24 January 2015 13:21:05'
        },

        {
          'chargeId': 1,
          'state:': {'status': 'created', 'finished': false},
          'state_friendly': 'Service created payment of £10.00',
          'updated': '2015-12-24 13:21:05',
          'updated_friendly': '24 January 2015 13:21:05'
        }
      ],
      permissions: {
        'transactions_email_read': true,
        'transactions_card_type_read': true,
        'transactions_description_read': true,
        'transactions_events_read': true
      }
    }

    let body = renderTemplate('transaction_detail/index', templateData)
    body.should.not.containSelector('#amount')
    templateData.events.forEach(function (transactionData, ix) {
      body.should.containSelector('table.transaction-events')
        .havingRowAt(ix + 1)
        .withTableDataAt(1, templateData.events[ix].state_friendly)
        .withTableDataAt(2, templateData.events[ix].updated_friendly)
    })
  })

  it('should not render transaction events if no permission', function () {
    let templateData = {
      'reference': '<123412341234> &',
      'email': 'alice.111@mail.fake',
      'amount': '£10.00',
      'gateway_account_id': '1',
      'refundable': true,
      'refunded': true,
      'refunded_amount': '£5.00',
      'charge_id': '1',
      'description': 'First ever',
      'state': {
        'status': 'success',
        'finished': true
      },
      'card_brand': 'Visa',
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
      'state_friendly': 'Success',
      'gateway_transaction_id': '938c54a7-4186-4506-bfbe-72a122da6528',
      'events': [
        {
          'chargeId': 1,
          'state:': {'status': 'success', 'finished': true},
          'state_friendly': 'Payment of £10.00 succeeded',
          'updated': '2015-12-24 13:21:05',
          'updated_friendly': '24 January 2015 13:21:05'
        }
      ],
      permissions: {
        'transactions_amount_read': true,
        'transactions_email_read': true,
        'transactions_card_type_read': true,
        'transactions_description_read': true
      }
    }

    let body = renderTemplate('transaction_detail/index', templateData)

    body.should.not.containSelector('table.transaction-events')
  })

  it('should not render transaction description if no permission', function () {
    let templateData = {
      'reference': '<123412341234> &',
      'email': 'alice.111@mail.fake',
      'amount': '£10.00',
      'gateway_account_id': '1',
      'refundable': true,
      'refunded': true,
      'refunded_amount': '£5.00',
      'charge_id': '1',
      'description': 'First ever',
      'state': {
        'status': 'success',
        'finished': true
      },
      'card_brand': 'Visa',
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
      'state_friendly': 'Success',
      'gateway_transaction_id': '938c54a7-4186-4506-bfbe-72a122da6528',
      'events': [],
      permissions: {
        'transactions_amount_read': true,
        'transactions_email_read': true,
        'transactions_card_type_read': true,
        'transactions_events_read': true
      }
    }

    let body = renderTemplate('transaction_detail/index', templateData)

    body.should.not.containSelector('#description')
  })

  it('should not render transaction card brand if no permission', function () {
    let templateData = {
      'reference': '<123412341234> &',
      'email': 'alice.111@mail.fake',
      'amount': '£10.00',
      'gateway_account_id': '1',
      'refundable': true,
      'refunded': true,
      'refunded_amount': '£5.00',
      'charge_id': '1',
      'description': 'First ever',
      'state': {
        'status': 'success',
        'finished': true
      },
      'card_brand': 'Visa',
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
      'state_friendly': 'Success',
      'gateway_transaction_id': '938c54a7-4186-4506-bfbe-72a122da6528',
      'events': [],
      permissions: {
        'transactions_amount_read': true,
        'transactions_email_read': true,
        'transactions_description_read': true,
        'transactions_events_read': true
      }
    }

    let body = renderTemplate('transaction_detail/index', templateData)

    body.should.not.containSelector('#brand')
  })

  it('should not render transaction email if no permission', function () {
    let templateData = {
      'reference': '<123412341234> &',
      'email': 'alice.111@mail.fake',
      'amount': '£10.00',
      'gateway_account_id': '1',
      'refundable': true,
      'refunded': true,
      'refunded_amount': '£5.00',
      'charge_id': '1',
      'description': 'First ever',
      'state': {
        'status': 'success',
        'finished': true
      },
      'card_brand': 'Visa',
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
      'state_friendly': 'Success',
      'gateway_transaction_id': '938c54a7-4186-4506-bfbe-72a122da6528',
      'events': [],
      permissions: {
        'transactions_amount_read': true,
        'transactions_card_type_read': true,
        'transactions_description_read': true,
        'transactions_events_read': true
      }
    }

    let body = renderTemplate('transaction_detail/index', templateData)

    body.should.not.containSelector('#email')
  })
})
