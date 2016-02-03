process.env.SESSION_ENCRYPTION_KEY = 'naskjwefvwei72rjkwfmjwfi72rfkjwefmjwefiuwefjkbwfiu24fmjbwfk';

var request = require('supertest');
var portfinder = require('portfinder');
var nock = require('nock');
var app = require(__dirname + '/../server.js').getApp;
var auth_cookie = require(__dirname + '/utils/login-session.js');

var winston = require('winston');

portfinder.getPort(function (err, connectorPort) {
    var now;
    var gatewayAccountId = 651342;
    var searchParameters = {};
    var CHARGES_API_PATH = '/v1/api/accounts/' + gatewayAccountId + '/charges';
    var DOWNLOAD_TRANSACTION_LIST_PATH = '/selfservice/transactions/download';

    var localServer = 'http://localhost:' + connectorPort;
    var connectorMock = nock(localServer, {
        reqheaders: {
            'Accept': 'text/csv'
        }

    });
    var AUTH_COOKIE_VALUE = auth_cookie.create({passport: {user: {_json: {app_metadata: {account_id: gatewayAccountId}}}}});

    function connectorMock_responds(code, data, searchParameters) {
        var queryStr = '?';
        queryStr += 'reference=' + (searchParameters.reference ? searchParameters.reference : '') +
            '&status=' + (searchParameters.status ? searchParameters.status : '') +
            '&from_date=' + (searchParameters.fromDate ? searchParameters.fromDate : '') +
            '&to_date=' + (searchParameters.toDate ? searchParameters.toDate : '');
        return connectorMock.get(CHARGES_API_PATH + encodeURI(queryStr))
            .reply(code, data);
    }

    function download_transaction_list() {
        return request(app)
            .get(DOWNLOAD_TRANSACTION_LIST_PATH)
            .set('Accept', 'application/json')
            .set('Cookie', ['session=' + AUTH_COOKIE_VALUE]);
    }

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

                connectorMock_responds(200, 'csv data', searchParameters);

                download_transaction_list()
                    .expect(200)
                    .expect('Content-Type', 'text/csv')
                    .expect('Content-disposition', /attachment; filename=GOVUK Pay \d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d.csv/)
                    .expect(function (res) {
                        res.res.text.should.eql('csv data');
                    })
                    .end(done);
            });


            it('should show error message on a bad request', function (done) {
              var errorMessage = 'Unable to download list of transactions.';
              connectorMock_responds(400, {'message': errorMessage}, searchParameters);

              download_transaction_list()
                .expect(200, {'message': errorMessage})
                .end(done);

            });

            it('should show a generic error message on a connector service error.', function (done) {
              connectorMock_responds(500, {'message': 'some error from connector'}, searchParameters);

              download_transaction_list()
                .expect(200, {'message': 'Unable to download list of transactions.'})
                .end(done);
            });

            it('should show internal error message if any error happens while retrieving the list from connector', function (done){
              // No connectorMock defined on purpose to mock a network failure

              download_transaction_list()
                .expect(200, {'message': 'Internal server error'})
                .end(done);
            });
        });
    });
});
