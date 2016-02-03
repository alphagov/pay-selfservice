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
                    'created_date': '2016-01-11 01:01:01'
                },
                {
                    'charge_id': '101',
                    'amount': '20.00',
                    'reference': 'ref1',
                    'status': 'TEST STATUS 2',
                    'created_date': '2016-01-11 01:01:01'
                }
            ],
            'filters': {'reference': 'ref1', 'fromDate': '2015-01-11 01:01:01'},
            'hasResults': true
        };

        var body = renderTemplate('transactions/index', templateData);

        body.should.containSelector('#download-transactions-link');

        templateData.results.forEach(function (transactionData, ix) {
            body.should.containSelector('h3#total-results').withExactText('\n  2 transactions\n    from 2015-01-11 01:01:01\n');
            body.should.containInputField('reference', 'text').withAttribute('value', 'ref1');
            body.should.containInputField('fromDate', 'text').withAttribute('value', '2015-01-11 01:01:01');
            body.should.containSelector('table#transaction-list')
                .havingRowAt(ix + 1)
                .withTableDataAt(1, templateData.results[ix].charge_id)
                .withTableDataAt(2, templateData.results[ix].reference)
                .withTableDataAt(3, templateData.results[ix].amount)
                .withTableDataAt(4, templateData.results[ix].status)
                //TODO: Change the index from 6 to 5 once PP-279 pay-endtoend has been merged to master
                //      This is for backwards compatibility
                .withTableDataAt(5, templateData.results[ix].created_date);
        });
    });

    it('should render no transactions', function () {

        var templateData = {
            'results': [],
            'hasResults': false
        };

        var body = renderTemplate('transactions/index', templateData);

        body.should.not.containSelector('#download-transactions-link');

        templateData.results.forEach(function (transactionData, ix) {
            body.should.containSelector('p#no-results').withExactText('No results match the search criteria.');
        });
    });
});