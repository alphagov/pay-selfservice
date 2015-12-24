var response = require('../utils/response.js').response;
var renderErrorView = require('../utils/response.js').renderErrorView;
var ConnectorClient = require('../services/connector_client.js').ConnectorClient;
var Client = require('node-rest-client').Client;
var client = new Client();

var TRANSACTIONS_LIST_PATH = '/selfservice/transactions/' + ':gatewayAccountId';
var TRANSACTIONS_VIEW_PATH = TRANSACTIONS_LIST_PATH + '/:chargeId';

function formatForView(connectorData) {
    connectorData.results.forEach(function (element) {
        element.amount = (element.amount / 100).toFixed(2);
        element.reference = element.reference || ""; // tolerate missing reference
    });
    return connectorData;
}

function buildTransactionView(chargeData, eventsData) {
    return {
        'charge_id': 452345,
        "description": "Breathing licence",
        "reference": "Ref-1234",
        "amount": 5000,
        "gateway_account_id": "10",
        "status": "SUCCEEDED",
        "gateway_transaction_id": "dsfh-34578fb-4und-8dhry",
        "events": [
            {
                'status': 'Payment of £50.00 was created',
                'updated': '23-12-2015 13:21:05'
            },
            {
                'status': 'Payment of £50.00 is in progress',
                'updated': '23-12-2015 13:23:12'
            },
            {
                'status': 'Payment of £50.00 successfully captured',
                'updated': '24-12-2015 12:05:43'
            }
        ]
    }
}

function connectorClient() {
    return new ConnectorClient(process.env.CONNECTOR_URL);
}

module.exports.bindRoutesTo = function (app) {

    /**
     * Display all the transactions for a given accountId
     */
    app.get(TRANSACTIONS_LIST_PATH, function (req, res) {
        var gatewayAccountId = req.params.gatewayAccountId;
        var onError = function (err, response) {
            if (response) {
                if (response.statusCode === 400) {
                    renderErrorView(req, res, err);
                } else {
                    renderErrorView(req, res, 'Unable to retrieve list of transactions.');
                }
            } else {
                renderErrorView(req, res, 'Internal server error');
            }
            return;
        };

        var onSuccess = function (charges) {
            response(req.headers.accept, res, 'transactions', formatForView(charges));
            return;
        };

        connectorClient().getTransactionList(gatewayAccountId, onSuccess, onError);
    });

    /**
     *  Display transaction details for a given chargeId of an account.
     */
    app.get(TRANSACTIONS_VIEW_PATH, function (req, res) {
        var gatewayAccountId = req.params.gatewayAccountId;
        var chargeId = req.params.chargeId;

        var onError = function (err, response) {
            if (response) {
                console.log("errorStatus = " + response.statusCode);
                if (response.statusCode === 404) {
                    renderErrorView(req, res, 'charge not found');
                } else {
                    renderErrorView(req, res, 'Error processing transaction view');
                }
            } else {
                renderErrorView(req, res, 'Error processing transaction view');
            }
            return;
        };

        var onSuccess = function (charge, events) {
            response(req.headers.accept, res, 'transaction_details', buildTransactionView(charge, events));
        };

        connectorClient().getCharge(gatewayAccountId, chargeId,
            function (charge) {
                connectorClient().getChargeEvents(gatewayAccountId, chargeId,
                    function (events) {
                        onSuccess(charge, events);
                    }, onError)
            }, onError);
    });
};