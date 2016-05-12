process.env.SESSION_ENCRYPTION_KEY = 'naskjwefvwei72rjkwfmjwfi72rfkjwefmjwefiuwefjkbwfiu24fmjbwfk';
var request         = require('supertest');
var portfinder      = require('portfinder');
var nock            = require('nock');
var _app             = require(__dirname + '/../../server.js').getApp;
var querystring     = require('querystring');
var paths           = require(__dirname + '/../../app/paths.js');
var winston         = require('winston');
var session     = require(__dirname + '/../test_helpers/mock_session.js');

var gatewayAccountId = 651342;

var app = session.mockValidAccount(_app, gatewayAccountId);


var CHARGES_API_PATH = '/v1/api/accounts/' + gatewayAccountId + '/charges';
var localServer = process.env.CONNECTOR_URL;
var connectorMock = nock(localServer);

    function connectorMock_responds(code, data, searchParameters) {
        var queryStr = '?';
        queryStr += 'reference=' + (searchParameters.reference ? searchParameters.reference : '') +
            '&state=' + (searchParameters.state ? searchParameters.state : '') +
            '&from_date=' + (searchParameters.fromDate ? searchParameters.fromDate : '') +
            '&to_date=' + (searchParameters.toDate ? searchParameters.toDate : '') +
            '&page=' + (searchParameters.page ? searchParameters.page : 1) +
            '&display_size=' + (searchParameters.pageSize ? searchParameters.pageSize : 100);

        return connectorMock.get(CHARGES_API_PATH + encodeURI(queryStr))
            .reply(code, data);
    }

function download_transaction_list(query) {
    return request(app)
        .get(paths.transactions.download + "?" + querystring.stringify(query));
}


mockJson = { results:
   [ { amount: 12345,
       state: {},
       status: 'SUCCEEDED',
       description: 'desc',
       reference: 'red',
       links: [],
       charge_id: 'sng0f5po5fms1vcicsu70tilab',
       gateway_transaction_id: '538fc22c-2dbd-42ce-afb6-b2e4ab7a24ec',
       return_url: 'https://demoservice.pymnt.localdomain:443/return/red',
       payment_provider: 'sandbox',
       created_date: '2016-05-12T16:37:29.245Z' } ] };

describe('Transaction download endpoints', function () {

    beforeEach(function () {
        process.env.CONNECTOR_URL = localServer;
        nock.cleanAll();
    });

    before(function () {
        // Disable logging.
        winston.level = 'none';
    });

    describe('The /transactions/download endpoint', function () {
        it('should download a csv file comprising a list of transactions for the gateway account', function (done) {

            connectorMock_responds(200, mockJson, {});

            download_transaction_list()
                .expect(200)
                .expect('Content-Type', 'text/csv; charset=utf-8')
                .expect('Content-disposition', /attachment; filename=GOVUK Pay \d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d.csv/)
                .end(done);
        });

        it('should download a csv file comprising a list of transactions for the gateway account and the given filter', function (done) {

            connectorMock_responds(200, 'csv data', {
                reference: 'ref',
                state: '1234',
                from_date: '2016-01-11 01:01:01',
                to_date: '2016-01-11 01:01:01'
            });

            download_transaction_list({
                reference: 'ref',
                state: '1234',
                from_date: '2016-01-11 01:01:01',
                to_date: '2016-01-11 01:01:01'
            })
                .expect(200)
                .expect('Content-Type', 'text/csv; charset=utf-8')
                .expect('Content-disposition', /attachment; filename=GOVUK Pay \d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d.csv/)
                .end(done);
        });

        it('should show error message on a bad request', function (done) {
            var errorMessage = 'Unable to download list of transactions.';
            connectorMock_responds(400, {'message': errorMessage}, {});

            download_transaction_list()
                .expect(500)
                .end(done);

        });

        it('should show a generic error message on a connector service error.', function (done) {
            connectorMock_responds(500, {'message': 'some error from connector'}, {});

            download_transaction_list()
                .expect(500)
                .end(done);
        });

        it('should show internal error message if any error happens while retrieving the list from connector', function (done) {
            // No connectorMock defined on purpose to mock a network failure

            download_transaction_list()
                .expect(500)
                .end(done);
        });
    });
});

