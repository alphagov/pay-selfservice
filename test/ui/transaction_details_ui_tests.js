require(__dirname + '/../test_helpers/html_assertions.js');
var cheerio = require('cheerio');
var should = require('chai').should();

var renderTemplate = require(__dirname + '/../test_helpers/test_renderer.js').render;

describe('The transaction details view', function () {
  it('should render all transaction details', function () {
    var templateData = {
        'reference':'<123412341234> &',
        'amount':'£10.00',
        'gateway_account_id':'1',
        'charge_id':'1',
        'description':'First ever',
        'state' : {
          'status':'confirmed',
          'finished': true
        },
        'state_friendly': 'Confirmed',
        'gateway_transaction_id':'938c54a7-4186-4506-bfbe-72a122da6528',

        'events':[
            {'chargeId':1,
             'state:' : { 'status': 'confirmed', 'finished' : true },
             'state_friendly':'Payment of £10.00 confirmed by payment provider',
             'updated': "2015-12-24 13:21:05",
             'updated_friendly': "24 January 2015 13:21:05"},

            {'chargeId':1,
             'state:' : { 'status': 'submitted', 'finished' : false },
             'state_friendly':'User submitted payment details for payment of £10.00',
             'updated': "2015-12-24 13:21:05",
             'updated_friendly': "24 January 2015 13:21:05"},

            {'chargeId':1,
             'state:' : { 'status': 'started', 'finished' : false },
             'state_friendly':'User started payment of AMOUNT',
             'updated': "2015-12-24 13:21:05",
             'updated_friendly': "24 January 2015 13:21:05"},

            {'chargeId':1,
             'state:' : { 'status': 'created', 'finished' : false },
             'state_friendly':'Service created payment of £10.00',
             'updated': "2015-12-24 13:21:05",
             'updated_friendly': "24 January 2015 13:21:05"},
        ]
    };

    var body = renderTemplate('transactions/show', templateData);
    var $ = cheerio.load(body);
    $('#reference').html().should.equal('&lt;123412341234&gt; &amp;');
    $('#amount').text().should.equal(templateData.amount);
    $('#payment-id').text().should.equal(templateData.charge_id);
    $('#transaction-id').text().should.equal(templateData.gateway_transaction_id);
    $('#state').text().should.equal(templateData.state_friendly);
    $('#finished').text().should.equal(templateData.state.finished ? "✔" : "✖");

    templateData.events.forEach(function (transactionData, ix) {
      body.should.containSelector('table.transaction-events')
        .havingRowAt(ix + 1)
        .withTableDataAt(1, templateData.events[ix].state_friendly)
        .withTableDataAt(2, templateData.events[ix].updated_friendly);
    });
  });
});
