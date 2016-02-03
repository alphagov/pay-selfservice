require(__dirname + '/utils/html_assertions.js');
var cheerio = require('cheerio');
var should = require('chai').should();

var renderTemplate = require(__dirname + '/utils/test_renderer.js').render;

describe('The transaction details view', function () {
  it('should render all transaction details', function () {
    var templateData = {
        'reference':'123412341234',
        'amount':'£10.00',
        'gateway_account_id':'1',
        'charge_id':'1',
        'description':'First ever',
        'status':'SUCCEEDED',
        'gateway_transaction_id':'938c54a7-4186-4506-bfbe-72a122da6528',

        'events':[
            {'chargeId':1,
             'status':'Payment of £10.00 succeeded',
             'updated': "2015-12-24 13:21:05",
             'updated_friendly': "24 January 2015 13:21:05"},

            {'chargeId':1,
             'status':'Payment of £10.00 is in progress',
             'updated': "2015-12-24 13:21:05",
             'updated_friendly': "24 January 2015 13:21:05"},

            {'chargeId':1,
             'status':'Payment of £10.00 is in progress',
             'updated': "2015-12-24 13:21:05",
             'updated_friendly': "24 January 2015 13:21:05"},

            {'chargeId':1,
             'status':'Payment of £10.00 was created',
             'updated': "2015-12-24 13:21:05",
             'updated_friendly': "24 January 2015 13:21:05"},
        ]
    };

    var body = renderTemplate('transactions/show', templateData);
    var $ = cheerio.load(body);
    $('#reference').text().should.equal(templateData.reference);
    $('#amount').text().should.equal(templateData.amount);
    $('#payment-id').text().should.equal(templateData.charge_id);
    $('#transaction-id').text().should.equal(templateData.gateway_transaction_id);
    $('#status').text().should.equal(templateData.status);

    templateData.events.forEach(function (transactionData, ix) {
      body.should.containSelector('table.transaction-events')
        .havingRowAt(ix + 1)
        .withTableDataAt(1, templateData.events[ix].status)
        .withTableDataAt(2, templateData.events[ix].updated_friendly);
    });
  });
});
