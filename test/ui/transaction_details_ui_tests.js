require(__dirname + '/../test_helpers/html_assertions.js');
var cheerio = require('cheerio');
var should = require('chai').should();

var renderTemplate = require(__dirname + '/../test_helpers/test_renderer.js').render;

describe('The transaction details view', function () {
  it('should render transaction details when payment is not refundable', function () {
    var templateData = {
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
      'state_friendly': 'Success',
      'gateway_transaction_id': '938c54a7-4186-4506-bfbe-72a122da6528',
      'events': [
        {
          'chargeId': 1,
          'state:': {'status': 'success', 'finished': true},
          'state_friendly': 'Payment of £10.00 succeeded',
          'updated': "2015-12-24 13:21:05",
          'updated_friendly': "24 January 2015 13:21:05"
        },

        {
          'chargeId': 1,
          'state:': {'status': 'submitted', 'finished': false},
          'state_friendly': 'User submitted payment details for payment of £10.00',
          'updated': "2015-12-24 13:21:05",
          'updated_friendly': "24 January 2015 13:21:05"
        },

        {
          'chargeId': 1,
          'state:': {'status': 'started', 'finished': false},
          'state_friendly': 'User started payment of AMOUNT',
          'updated': "2015-12-24 13:21:05",
          'updated_friendly': "24 January 2015 13:21:05"
        },

        {
          'chargeId': 1,
          'state:': {'status': 'created', 'finished': false},
          'state_friendly': 'Service created payment of £10.00',
          'updated': "2015-12-24 13:21:05",
          'updated_friendly': "24 January 2015 13:21:05"
        },
      ]
    };

    var body = renderTemplate('transactions/show', templateData);
    var $ = cheerio.load(body);
    body.should.not.containSelector('#show-refund');
    body.should.not.containSelector('#refunded-amount');
    $('#arrowed').attr('href').should.equal('?reference=&email=&state=&fromDate=&fromTime=&toDate=&toTime=');
    $('#reference').html().should.equal('&lt;123412341234&gt; &amp;');
    $('#email').html().should.equal('alice.111@mail.fake');
    $('#amount').text().should.equal(templateData.amount);
    $('#payment-id').text().should.equal(templateData.charge_id);
    $('#transaction-id').text().should.equal(templateData.gateway_transaction_id);
    $('#refunded').text().should.equal("✖");
    $('#state').text().should.equal(templateData.state_friendly);

    templateData.events.forEach(function (transactionData, ix) {
      body.should.containSelector('table.transaction-events')
        .havingRowAt(ix + 1)
        .withTableDataAt(1, templateData.events[ix].state_friendly)
        .withTableDataAt(2, templateData.events[ix].updated_friendly);
    });
  });

  it('should render transaction details when payment has been refunded', function () {
    var templateData = {
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
      'state_friendly': 'Success',
      'gateway_transaction_id': '938c54a7-4186-4506-bfbe-72a122da6528',
      'events': [
        {
          'chargeId': 1,
          'state:': {'status': 'success', 'finished': true},
          'state_friendly': 'Payment of £10.00 succeeded',
          'updated': "2015-12-24 13:21:05",
          'updated_friendly': "24 January 2015 13:21:05"
        },

        {
          'chargeId': 1,
          'state:': {'status': 'submitted', 'finished': false},
          'state_friendly': 'User submitted payment details for payment of £10.00',
          'updated': "2015-12-24 13:21:05",
          'updated_friendly': "24 January 2015 13:21:05"
        },

        {
          'chargeId': 1,
          'state:': {'status': 'started', 'finished': false},
          'state_friendly': 'User started payment of AMOUNT',
          'updated': "2015-12-24 13:21:05",
          'updated_friendly': "24 January 2015 13:21:05"
        },

        {
          'chargeId': 1,
          'state:': {'status': 'created', 'finished': false},
          'state_friendly': 'Service created payment of £10.00',
          'updated': "2015-12-24 13:21:05",
          'updated_friendly': "24 January 2015 13:21:05"
        },
      ]
    };

    var body = renderTemplate('transactions/show', templateData);
    var $ = cheerio.load(body);
    body.should.containSelector('#show-refund');
    $('#reference').html().should.equal('&lt;123412341234&gt; &amp;');
    $('#email').html().should.equal('alice.111@mail.fake');
    $('#amount').text().should.equal(templateData.amount);
    $('#payment-id').text().should.equal(templateData.charge_id);
    $('#transaction-id').text().should.equal(templateData.gateway_transaction_id);
    $('#refunded').text().should.equal("✔");
    $('#refunded-amount').text().should.equal("£5.00");
    $('#state').text().should.equal(templateData.state_friendly);

    templateData.events.forEach(function (transactionData, ix) {
      body.should.containSelector('table.transaction-events')
        .havingRowAt(ix + 1)
        .withTableDataAt(1, templateData.events[ix].state_friendly)
        .withTableDataAt(2, templateData.events[ix].updated_friendly);
    });
  });
});
