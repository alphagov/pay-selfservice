require(__dirname + '/utils/html_assertions.js');
var should = require('chai').should();

var renderTemplate = require(__dirname + '/utils/test_renderer.js').render;

describe('The transaction list view', function () {
  it('should render all transactions', function () {

    var templateData = {
      'results': [
        {
          'charge_id': '100',
          'amount': '50.00',
          'reference': 'ref1',
          'status': 'TEST STATUS',
          'updated': '2016-01-11 01:01:01'
        },
        {
          'charge_id': '101',
          'amount': '20.00',
          'reference': 'ref1',
          'status': 'TEST STATUS 2',
          'updated': '2016-01-11 01:01:01'
        }
      ]
    };

    var body = renderTemplate('transactions', templateData);

    templateData.results.forEach(function (transactionData, ix) {
      body.should.containSelector('table#transaction-list')
        .havingRowAt(ix + 1)
        .withTableDataAt(1, templateData.results[ix].charge_id)
        .withTableDataAt(2, templateData.results[ix].amount)
        .withTableDataAt(3, templateData.results[ix].reference)
        .withTableDataAt(4, templateData.results[ix].status)
        //TODO: Change the index from 6 to 5 once PP-279 pay-endtoend has been merged to master
        //      This is for backwards compatibility
        .withTableDataAt(6, templateData.results[ix].updated);
    });
  });
});