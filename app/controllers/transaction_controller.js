var logger = require('winston');
var response = require('../utils/response.js').response;
var renderErrorView = require('../utils/response.js').renderErrorView;
var Client = require('node-rest-client').Client;
var client = new Client();

var TRANSACTIONS_LIST_PATH = '/selfservice/transactions/' + ':gatewayAccountId';
var TRANSACTIONS_VIEW_PATH = TRANSACTIONS_LIST_PATH + '/:chargeId';
var CONNECTOR_CHARGE_PATH = '/v1/frontend/charges';
var CONNECTOR_CHARGE_API_PATH = '/v1/api/accounts/{accountId}/charges/{chargeId}';

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
        "events" : [
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

module.exports.bindRoutesTo = function (app) {

    /**
     * Display all the transactions for a given accountId
     */
    app.get(TRANSACTIONS_LIST_PATH, function (req, res) {

        var gatewayAccountId = req.params.gatewayAccountId;
        logger.info('GET ' + TRANSACTIONS_LIST_PATH + gatewayAccountId);

        var connectorUrl = process.env.CONNECTOR_URL + CONNECTOR_CHARGE_PATH + '?gatewayAccountId=' + gatewayAccountId;

        client.get(connectorUrl, function (connectorData, connectorResponse) {

            if (connectorResponse.statusCode === 200) {
                response(req.headers.accept, res, 'transactions', formatForView(connectorData));
                return;
            }

            logger.error('Error getting transaction list from connector. Connector response data: ' + connectorData);
            if (connectorResponse.statusCode === 400) {
                renderErrorView(req, res, connectorData.message);
                return;
            }

            renderErrorView(req, res, 'Unable to retrieve list of transactions.');

        }).on('error', function (err) {
            logger.error('Exception raised calling connector:' + err);
            renderErrorView(req, res, 'Internal server error');
        });

    });

    /**
     *  Display transaction details for a given chargeId of an account.
     */
    app.get(TRANSACTIONS_VIEW_PATH, function(req, res){
        var gatewayAccountId = req.params.gatewayAccountId;
        var chargeId = req.params.chargeId;

        logger.info('GET ' + TRANSACTIONS_VIEW_PATH
                .replace("gatewayAccountId",gatewayAccountId)
                .replace("chargeId", chargeId));

        var getChargeUrl = process.env.CONNECTOR_URL + CONNECTOR_CHARGE_API_PATH.replace("{accountId}", gatewayAccountId).replace("{chargeId}", chargeId);
        var getEventsUrl = getChargeUrl + "/events";
        logger.info('CONNECTOR GET ' + getChargeUrl);

        client.get(getChargeUrl, function (chargeData, chargeResponse) {

            client.get(getEventsUrl, function (eventsData, eventsResponse) {
                response(req.headers.accept, res, 'transaction_details', buildTransactionView(chargeData, eventsData));
                return;

            }).on('error', function (err) {
                logger.error('Exception raised calling connector:' + err);
                renderErrorView(req, res, 'Internal server error');
            });

        }).on('error', function (err) {
            logger.error('Exception raised calling connector:' + err);
            renderErrorView(req, res, 'Internal server error');
        });
    });
};