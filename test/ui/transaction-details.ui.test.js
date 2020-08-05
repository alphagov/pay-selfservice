'use strict'

// NPM dependencies
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const path = require('path')
const cheerio = require('cheerio')
chai.should()
chai.use(chaiAsPromised)

// Local dependencies
const renderTemplate = require(path.join(__dirname, '/../test-helpers/html-assertions.js')).render

describe('The transaction details view', () => {
  it('should render transaction details when payment does not have card details', () => {
    const templateData = {
      'reference': '<123412341234> &',
      'email': 'alice.111@mail.fake',
      'indexFilters': 'reference=&email=&state=&fromDate=&fromTime=&toDate=&toTime=',
      'amount': '£10.00',
      'gateway_account_id': '1',
      'refundable': false,
      'refunded': false,
      'charge_id': '1',
      'description': 'First ever',
      'state_friendly': 'Declined',
      'state': {
        'status': 'Failed',
        'finished': true
      },
      'card_details': {
        'card_brand': 'Data unavailable',
        'cardholder_name': 'Data unavailable',
        'expiry_date': 'Data unavailable',
        'last_digits_card_number': '****',
        'first_digits_card_number': '**** **'
      },
      'gateway_transaction_id': '938c54a7-4186-4506-bfbe-72a122da6528',
      'events': [
        {
          'chargeId': 1,
          state: {
            status: 'error', finished: true, message: 'Payment provider returned an error', code: 'P0050'
          },
          'state_friendly': '',
          'amount_friendly': '£10.00',
          'updated': '2015-12-24 13:21:05',
          'updated_friendly': '24 January 2015 13:21:05'
        },
        {
          'chargeId': 1,
          state: {
            status: 'failed',
            finished: false,
            message: 'Payment was cancelled by the user',
            code: 'P0030'
          },
          'state_friendly': '',
          'amount_friendly': '£10.00',
          'updated': '2015-12-24 13:21:05',
          'updated_friendly': '24 January 2015 13:21:05'
        }
      ],
      'delayed_capture': true,
      permissions: {
        'transactions_amount_read': true,
        'transactions_email_read': true,
        'transactions_card_type_read': true,
        'transactions_description_read': true,
        'transactions_events_read': true
      }
    }

    const body = renderTemplate('transaction_detail/index', templateData)
    const $ = cheerio.load(body)
    body.should.not.containSelector('.refund__toggle-container')
    $('.govuk-back-link').attr('href').should.equal('/transactions?reference=&email=&state=&fromDate=&fromTime=&toDate=&toTime=')
    $('#reference').html().should.equal('&lt;123412341234&gt; &amp;')
    $('#description').html().should.equal('First ever')
    $('#email').html().should.equal('alice.111@mail.fake')
    $('#amount').text().should.equal(templateData.amount)
    $('#payment-id').text().should.equal(templateData.charge_id)
    $('#transaction-id').text().should.equal(templateData.gateway_transaction_id)
    $('#refunded-amount').text().should.contain('£0.00')
    $('#state').text().should.contain(templateData.state_friendly)
    $('#state summary').text().should.contain('What does this mean?')
    $('#brand').text().should.equal('Data unavailable')
    $('#cardholder_name').text().should.equal('Data unavailable')
    $('#card_number').text().should.equal('**** **** **** ****')
    $('#card_expiry_date').text().should.equal('Data unavailable')
    $('#delayed-capture').text().should.equal('On')
    //
    templateData.events.forEach((transactionData, ix) => {
      body.should.containSelector('table.transaction-events')
        .havingRowAt(ix + 1)
        .withTableDataAt(1, `${templateData.events[ix].state.code} - ${templateData.events[ix].state.message}`)
        .withTableDataAt(2, templateData.events[ix].amount_friendly)
        .withTableDataAt(3, templateData.events[ix].updated_friendly)
    })
  })

  it('should render transaction details when payment is not refundable', () => {
    const templateData = {
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
        'last_digits_card_number': '4242',
        'first_digits_card_number': '4242 42'
      },
      'state_friendly': 'Success',
      'gateway_transaction_id': '938c54a7-4186-4506-bfbe-72a122da6528',
      'events': [
        {
          'chargeId': 1,
          'state:': { 'status': 'success', 'finished': true },
          'state_friendly': 'Payment succeeded',
          'amount_friendly': '£10.00',
          'updated': '2015-12-24 13:21:05',
          'updated_friendly': '24 January 2015 13:21:05'
        },

        {
          'chargeId': 1,
          'state:': { 'status': 'submitted', 'finished': false },
          'state_friendly': 'User submitted payment details for payment',
          'amount_friendly': '£10.00',
          'updated': '2015-12-24 13:21:05',
          'updated_friendly': '24 January 2015 13:21:05'
        },

        {
          'chargeId': 1,
          'state:': { 'status': 'started', 'finished': false },
          'state_friendly': 'User started payment of AMOUNT',
          'amount_friendly': '£10.00',
          'updated': '2015-12-24 13:21:05',
          'updated_friendly': '24 January 2015 13:21:05'
        },

        {
          'chargeId': 1,
          'state:': { 'status': 'created', 'finished': false },
          'state_friendly': 'Service created payment',
          'amount_friendly': '£10.00',
          'updated': '2015-12-24 13:21:05',
          'updated_friendly': '24 January 2015 13:21:05'
        }
      ],
      'delayed_capture': false,
      permissions: {
        'transactions_amount_read': true,
        'transactions_email_read': true,
        'transactions_card_type_read': true,
        'transactions_description_read': true,
        'transactions_events_read': true
      }
    }

    const body = renderTemplate('transaction_detail/index', templateData)
    const $ = cheerio.load(body)
    body.should.not.containSelector('.refund__toggle-container')
    $('.govuk-back-link').attr('href').should.equal('/transactions?reference=&email=&state=&fromDate=&fromTime=&toDate=&toTime=')
    $('#reference').html().should.equal('&lt;123412341234&gt; &amp;')
    $('#description').html().should.equal('First ever')
    $('#email').html().should.equal('alice.111@mail.fake')
    $('#amount').text().should.equal(templateData.amount)
    $('#payment-id').text().should.equal(templateData.charge_id)
    $('#transaction-id').text().should.equal(templateData.gateway_transaction_id)
    $('#state').text().should.contain(templateData.state_friendly)
    $('#brand').text().should.equal(templateData.card_brand)
    $('#refunded-amount').text().should.contain('£0.00')
    $('#cardholder_name').text().should.equal(templateData.card_details.cardholder_name)
    $('#card_number').text().should.equal(templateData.card_details.first_digits_card_number + '** **** ' + templateData.card_details.last_digits_card_number)
    $('#card_expiry_date').text().should.equal(templateData.card_details.expiry_date)
    body.should.not.containSelector('#delayed-capture')

    templateData.events.forEach(function (transactionData, ix) {
      body.should.containSelector('table.transaction-events')
        .havingRowAt(ix + 1)
        .withTableDataAt(1, templateData.events[ix].state_friendly)
        .withTableDataAt(2, templateData.events[ix].amount_friendly)
        .withTableDataAt(3, templateData.events[ix].updated_friendly)
    })
  })

  it('should render transaction details when payment has been refunded', () => {
    const templateData = {
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
        'last_digits_card_number': '4242',
        'first_digits_card_number': '4242 42'
      },
      'state_friendly': 'Success',
      'gateway_transaction_id': '938c54a7-4186-4506-bfbe-72a122da6528',
      'events': [
        {
          'type': 'REFUND',
          'chargeId': 1,
          'refund_reference': 'refund001',
          'state:': { 'status': 'submitted', 'finished': false },
          'state_friendly': 'Refund submitted',
          'submitted_by_friendly': 'bob@example.com',
          'updated': '2015-12-24 13:21:05',
          'amount_friendly': '-£10.00',
          'updated_friendly': '24 January 2015 13:21:05'
        },
        {
          'chargeId': 1,
          'state:': { 'status': 'success', 'finished': true },
          'state_friendly': 'Payment succeeded',
          'updated': '2015-12-24 13:21:05',
          'amount_friendly': '£10.00',
          'updated_friendly': '24 January 2015 13:21:05'
        },

        {
          'chargeId': 1,
          'state:': { 'status': 'submitted', 'finished': false },
          'state_friendly': 'User submitted payment details for payment',
          'updated': '2015-12-24 13:21:05',
          'amount_friendly': '£10.00',
          'updated_friendly': '24 January 2015 13:21:05'
        },

        {
          'chargeId': 1,
          'state:': { 'status': 'started', 'finished': false },
          'state_friendly': 'User started payment of AMOUNT',
          'updated': '2015-12-24 13:21:05',
          'amount_friendly': '£10.00',
          'updated_friendly': '24 January 2015 13:21:05'
        },

        {
          'chargeId': 1,
          'state:': { 'status': 'created', 'finished': false },
          'state_friendly': 'Service created payment',
          'updated': '2015-12-24 13:21:05',
          'amount_friendly': '£10.00',
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

    const body = renderTemplate('transaction_detail/index', templateData)
    const $ = cheerio.load(body)
    body.should.not.containSelector('.refund__toggle-container')
    $('#reference').html().should.equal('&lt;123412341234&gt; &amp;')
    $('#description').html().should.equal('First ever')
    $('#email').html().should.equal('alice.111@mail.fake')
    $('#amount').text().should.equal(templateData.amount)
    $('#payment-id').text().should.equal(templateData.charge_id)
    $('#transaction-id').text().should.equal(templateData.gateway_transaction_id)
    $('#refunded-amount').text().should.equal('–£5.00')
    $('#state').text().should.contain(templateData.state_friendly)
    $('#brand').text().should.equal(templateData.card_brand)
    $('#cardholder_name').text().should.equal(templateData.card_details.cardholder_name)
    $('#card_number').text().should.equal(templateData.card_details.first_digits_card_number + '** **** ' + templateData.card_details.last_digits_card_number)
    $('#card_expiry_date').text().should.equal(templateData.card_details.expiry_date)

    templateData.events.forEach((event, index) => {
      const tableRow = $('.transaction-events tr').eq(index)
      tableRow.find('td.amount').text().should.equal(event.amount_friendly)
      tableRow.find('span.state').text().should.equal(event.state_friendly)

      if (event.submitted_by_friendly) tableRow.find('span.submitted-by').text().should.equal(event.submitted_by_friendly)
      if (event.type === 'REFUND') tableRow.attr('data-gateway-refund-id').should.equal(event.refund_reference)
    })
  })

  it('should not render transaction amount if no permission', () => {
    const templateData = {
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
          'state:': { 'status': 'success', 'finished': true },
          'state_friendly': 'Payment succeeded',
          'updated': '2015-12-24 13:21:05',
          'amount_friendly': '£10.00',
          'updated_friendly': '24 January 2015 13:21:05'
        },

        {
          'chargeId': 1,
          'state:': { 'status': 'submitted', 'finished': false },
          'state_friendly': 'User submitted payment details for payment',
          'updated': '2015-12-24 13:21:05',
          'amount_friendly': '£10.00',
          'updated_friendly': '24 January 2015 13:21:05'
        },

        {
          'chargeId': 1,
          'state:': { 'status': 'started', 'finished': false },
          'state_friendly': 'User started payment of AMOUNT',
          'updated': '2015-12-24 13:21:05',
          'amount_friendly': '£10.00',
          'updated_friendly': '24 January 2015 13:21:05'
        },

        {
          'chargeId': 1,
          'state:': { 'status': 'created', 'finished': false },
          'state_friendly': 'Service created payment',
          'updated': '2015-12-24 13:21:05',
          'amount_friendly': '£10.00',
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

    const body = renderTemplate('transaction_detail/index', templateData)
    body.should.not.containSelector('#amount')
    templateData.events.forEach(function (transactionData, ix) {
      body.should.containSelector('table.transaction-events')
        .havingRowAt(ix + 1)
        .withTableDataAt(1, templateData.events[ix].state_friendly)
        .withTableDataAt(2, templateData.events[ix].amount_friendly)
        .withTableDataAt(3, templateData.events[ix].updated_friendly)
    })
  })

  it('should not render transaction events if no permission', () => {
    const templateData = {
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
        'last_digits_card_number': '4242',
        'first_digits_card_number': '4242 42'
      },
      'state_friendly': 'Success',
      'gateway_transaction_id': '938c54a7-4186-4506-bfbe-72a122da6528',
      'events': [
        {
          'chargeId': 1,
          'state:': { 'status': 'success', 'finished': true },
          'state_friendly': 'Payment succeeded',
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

    const body = renderTemplate('transaction_detail/index', templateData)

    body.should.not.containSelector('table.transaction-events')
  })

  it('should not render transaction description if no permission', () => {
    const templateData = {
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
        'last_digits_card_number': '4242',
        'first_digits_card_number': '4242 42'
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

    const body = renderTemplate('transaction_detail/index', templateData)

    body.should.not.containSelector('#description')
  })

  it('should not render transaction card brand if no permission', () => {
    const templateData = {
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
        'last_digits_card_number': '4242',
        'first_digits_card_number': '4242 42'
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

    const body = renderTemplate('transaction_detail/index', templateData)

    body.should.not.containSelector('#brand')
  })

  it('should not render transaction email if no permission', () => {
    const templateData = {
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
        'last_digits_card_number': '4242',
        'first_digits_card_number': '4242 42'
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

    const body = renderTemplate('transaction_detail/index', templateData)

    body.should.not.containSelector('#email')
  })
})
