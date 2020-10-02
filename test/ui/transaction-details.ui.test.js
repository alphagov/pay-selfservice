'use strict'

const chai = require('chai')
const path = require('path')
const cheerio = require('cheerio')

const renderTemplate = require(path.join(__dirname, '/../test-helpers/html-assertions.js')).render

expect(chai)()

describe('The transaction details view', () => {
  it(
    'should render transaction details when payment does not have card details',
    () => {
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

      const body = renderTemplate('transaction-detail/index', templateData)
      const $ = cheerio.load(body)
      expect(body).not.containSelector('.refund__toggle-container')
      expect($('.govuk-back-link').attr('href')).toBe(
        '/transactions?reference=&email=&state=&fromDate=&fromTime=&toDate=&toTime='
      )
      expect($('#reference').html()).toBe('&lt;123412341234&gt; &amp;')
      expect($('#description').html()).toBe('First ever')
      expect($('#email').html()).toBe('alice.111@mail.fake')
      expect($('#amount').text()).toBe(templateData.amount)
      expect($('#payment-id').text()).toBe(templateData.charge_id)
      expect($('#transaction-id').text()).toBe(templateData.gateway_transaction_id)
      expect($('#refunded-amount').text()).toEqual(expect.arrayContaining(['£0.00']))
      expect($('#state').text()).toEqual(expect.arrayContaining([templateData.state_friendly]))
      expect($('#state summary').text()).toEqual(expect.arrayContaining(['What does this mean?']))
      expect($('#brand').text()).toBe('Data unavailable')
      expect($('#cardholder_name').text()).toBe('Data unavailable')
      expect($('#card_number').text()).toBe('**** **** **** ****')
      expect($('#card_expiry_date').text()).toBe('Data unavailable')
      expect($('#delayed-capture').text()).toBe('On')
      //
      templateData.events.forEach((transactionData, ix) => {
        expect(body).containSelector('table.transaction-events')
          .havingRowAt(ix + 1)
          .withTableDataAt(1, `${templateData.events[ix].state.code} - ${templateData.events[ix].state.message}`)
          .withTableDataAt(2, templateData.events[ix].amount_friendly)
          .withTableDataAt(3, templateData.events[ix].updated_friendly)
      })
    }
  )

  it(
    'should render transaction details when payment is not refundable',
    () => {
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

      const body = renderTemplate('transaction-detail/index', templateData)
      const $ = cheerio.load(body)
      expect(body).not.containSelector('.refund__toggle-container')
      expect($('.govuk-back-link').attr('href')).toBe(
        '/transactions?reference=&email=&state=&fromDate=&fromTime=&toDate=&toTime='
      )
      expect($('#reference').html()).toBe('&lt;123412341234&gt; &amp;')
      expect($('#description').html()).toBe('First ever')
      expect($('#email').html()).toBe('alice.111@mail.fake')
      expect($('#amount').text()).toBe(templateData.amount)
      expect($('#payment-id').text()).toBe(templateData.charge_id)
      expect($('#transaction-id').text()).toBe(templateData.gateway_transaction_id)
      expect($('#state').text()).toEqual(expect.arrayContaining([templateData.state_friendly]))
      expect($('#brand').text()).toBe(templateData.card_brand)
      expect($('#refunded-amount').text()).toEqual(expect.arrayContaining(['£0.00']))
      expect($('#cardholder_name').text()).toBe(templateData.card_details.cardholder_name)
      expect($('#card_number').text()).toBe(
        templateData.card_details.first_digits_card_number + '** **** ' + templateData.card_details.last_digits_card_number
      )
      expect($('#card_expiry_date').text()).toBe(templateData.card_details.expiry_date)
      expect(body).not.containSelector('#delayed-capture')

      templateData.events.forEach(function (transactionData, ix) {
        expect(body).containSelector('table.transaction-events')
          .havingRowAt(ix + 1)
          .withTableDataAt(1, templateData.events[ix].state_friendly)
          .withTableDataAt(2, templateData.events[ix].amount_friendly)
          .withTableDataAt(3, templateData.events[ix].updated_friendly)
      })
    }
  )

  it(
    'should render transaction details when payment has been refunded',
    () => {
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

      const body = renderTemplate('transaction-detail/index', templateData)
      const $ = cheerio.load(body)
      expect(body).not.containSelector('.refund__toggle-container')
      expect($('#reference').html()).toBe('&lt;123412341234&gt; &amp;')
      expect($('#description').html()).toBe('First ever')
      expect($('#email').html()).toBe('alice.111@mail.fake')
      expect($('#amount').text()).toBe(templateData.amount)
      expect($('#payment-id').text()).toBe(templateData.charge_id)
      expect($('#transaction-id').text()).toBe(templateData.gateway_transaction_id)
      expect($('#refunded-amount').text()).toBe('–£5.00')
      expect($('#state').text()).toEqual(expect.arrayContaining([templateData.state_friendly]))
      expect($('#brand').text()).toBe(templateData.card_brand)
      expect($('#cardholder_name').text()).toBe(templateData.card_details.cardholder_name)
      expect($('#card_number').text()).toBe(
        templateData.card_details.first_digits_card_number + '** **** ' + templateData.card_details.last_digits_card_number
      )
      expect($('#card_expiry_date').text()).toBe(templateData.card_details.expiry_date)

      templateData.events.forEach((event, index) => {
        const tableRow = $('.transaction-events tr').eq(index)
        expect(tableRow.find('td.amount').text()).toBe(event.amount_friendly)
        expect(tableRow.find('span.state').text()).toBe(event.state_friendly)

        if (event.submitted_by_friendly) expect(tableRow.find('span.submitted-by').text()).toBe(event.submitted_by_friendly)
        if (event.type === 'REFUND') expect(tableRow.attr('data-gateway-refund-id')).toBe(event.refund_reference)
      })
    }
  )

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

    const body = renderTemplate('transaction-detail/index', templateData)
    expect(body).not.containSelector('#amount')
    templateData.events.forEach(function (transactionData, ix) {
      expect(body).containSelector('table.transaction-events')
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

    const body = renderTemplate('transaction-detail/index', templateData)

    expect(body).not.containSelector('table.transaction-events')
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

    const body = renderTemplate('transaction-detail/index', templateData)

    expect(body).not.containSelector('#description')
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

    const body = renderTemplate('transaction-detail/index', templateData)

    expect(body).not.containSelector('#brand')
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

    const body = renderTemplate('transaction-detail/index', templateData)

    expect(body).not.containSelector('#email')
  })
})
