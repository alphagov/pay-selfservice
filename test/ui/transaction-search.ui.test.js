'use strict'
const cheerio = require('cheerio')

const renderTemplate = require('../test-helpers/html-assertions.js').render

describe('The transaction list view', () => {
  it('should render all transactions', () => {
    var templateData = {
      'total': 2,
      'filtersDescription': '  from 2015-01-11 01:01:01   to 2015-01-11 01:01:01   with <strong>\'Refund success\'</strong>, <strong>\'Success\'</strong> states   with \'Visa\' card brand',
      'results': [
        {
          'charge_id': '100',
          'email': 'example1@mail.fake',
          'amount': '50.00',
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
      'filters': { 'reference': 'ref1', 'state': 'Testing2', 'brand': 'Visa', 'fromDate': '2015-01-11 01:01:01', 'toDate': '2015-01-11 01:01:01' },
      'hasResults': true,
      'downloadTransactionLink':
                '/transactions/download?reference=ref1&state=payment-testing2&from_date=2%2F0%2F2015%2001%3A01%3A01&&to_date=2%2F0%2F2015%2001%3A01%3A01',
      permissions: {
        'transactions_amount_read': true,
        'transactions_email_read': true,
        'transactions_card_type_read': true,
        'transactions_download_read': true
      },
      showCsvDownload: true,
      totalFormatted: 2
    }

    var body = renderTemplate('transactions/index', templateData)
    var $ = cheerio.load(body)

    expect($('#download-transactions-link').attr('href')).toBe(templateData.downloadTransactionLink)

    const totalResultsText = $('#total-results').text()
    expect(totalResultsText).toEqual(expect.arrayContaining(['2 transactions']))
    expect(totalResultsText).toEqual(expect.arrayContaining(['from 2015-01-11 01:01:01']))
    expect(totalResultsText).toEqual(expect.arrayContaining(['to 2015-01-11 01:01:01']))
    expect(totalResultsText).toEqual(expect.arrayContaining(['with \'Refund success\'']))
    expect(totalResultsText).toEqual(expect.arrayContaining(['\'Success\' states']))
    expect(totalResultsText).toEqual(expect.arrayContaining(['with \'Visa\' card brand']))
    expect($('input#reference').attr('value')).toBe('ref1')
    expect($('input#fromDate').attr('value')).toBe('2015-01-11 01:01:01')

    templateData.results.forEach(function (transactionData, ix) {
      const rowSelector = `table#transactions-list tr:nth-of-type(${ix + 1})`
      expect($(`${rowSelector} th a`).text()).toEqual(expect.arrayContaining([templateData.results[ix].reference]))
      expect($(`${rowSelector} td:nth-of-type(1)`).text()).toBe(templateData.results[ix].email)
      expect($(`${rowSelector} td:nth-of-type(2)`).text()).toBe(templateData.results[ix].amount)
      expect($(`${rowSelector} td:nth-of-type(3)`).text()).toBe(templateData.results[ix].card_details.card_brand)
      expect($(`${rowSelector} td:nth-of-type(4)`).text()).toBe(templateData.results[ix].state_friendly)
      expect($(`${rowSelector} td:nth-of-type(5)`).text()).toBe(templateData.results[ix].created)
    })
  })

  it('should render no transactions', () => {
    var templateData = {
      'results': [],
      'hasResults': false
    }

    var body = renderTemplate('transactions/index', templateData)
    const $ = cheerio.load(body)

    expect($('#download-transactions-link').length).toBe(0)
    expect($('p#no-results').text()).toBe('No results match the search criteria.')
  })
})
