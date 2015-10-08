require(__dirname + '/utils/html_assertions.js');
var should = require('chai').should();

var renderTemplate = require(__dirname + '/utils/test_renderer.js').render;

describe('The transaction list view', function () {
  it('should render all transactions', function () {

    var templateData = {
      'results': [
        {
          'charge_id': '100',
          'gateway_transaction_id': 'tnx-id-1',
          'amount': '50.00',
          'status': 'TEST STATUS'
        },
        {
          'charge_id': '101',
          'gateway_transaction_id': 'tnx-id-2',
          'amount': '20.00',
          'status': 'TEST STATUS 2'
        }
      ]
    };

    var body = renderTemplate('transactions', templateData);

    templateData.results.forEach(function (transactionData, ix) {
      body.should.containTableWithId('transaction-list')
        .havingRowAt(ix + 1)
        .withTableDataAt(1, templateData.results[ix].charge_id)
        .withTableDataAt(2, templateData.results[ix].gateway_transaction_id)
        .withTableDataAt(3, templateData.results[ix].amount)
        .withTableDataAt(4, templateData.results[ix].status);
    });
  });
});