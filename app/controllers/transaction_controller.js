var response = require('../utils/response.js').response;
var renderErrorView = require('../utils/response.js').renderErrorView;
var TransactionView = require('../utils/transaction_view.js').TransactionView;
var ConnectorClient = require('../services/connector_client.js').ConnectorClient;
var transactionView = new TransactionView();

var TRANSACTIONS_LIST_PATH = '/selfservice/transactions/' + ':gatewayAccountId';
var TRANSACTIONS_VIEW_PATH = TRANSACTIONS_LIST_PATH + '/:chargeId';

function connectorClient() {
    return new ConnectorClient(process.env.CONNECTOR_URL);
}

module.exports.bindRoutesTo = function (app) {

    /**
     * Display all the transactions for a given accountId
     */
    app.get(TRANSACTIONS_LIST_PATH, function (req, res) {
        var gatewayAccountId = req.params.gatewayAccountId;
        var showError = function (err, response) {
            if (response) {
                if (response.statusCode === 400) {
                    renderErrorView(req, res, err);
                } else {
                    renderErrorView(req, res, 'Unable to retrieve list of transactions.');
                }
            } else {
                renderErrorView(req, res, 'Internal server error');
            }
        };

        var showTransactions = function (charges) {
            response(req.headers.accept, res, 'transactions', transactionView.buildPaymentList(charges));
        };

        connectorClient().withTransactionList(gatewayAccountId, showTransactions)
            .on('connectorError', showError);
    });

    /**
     *  Display transaction details for a given chargeId of an account.
     */
    app.get(TRANSACTIONS_VIEW_PATH, function (req, res) {
        var gatewayAccountId = req.params.gatewayAccountId;
        var chargeId = req.params.chargeId;

        var showError = function (err, response) {
            if (response) {
                if (response.statusCode === 404) {
                    renderErrorView(req, res, 'charge not found');
                } else {
                    renderErrorView(req, res, 'Error processing transaction view');
                }
            } else {
                renderErrorView(req, res, 'Error processing transaction view');
            }
        };

        var showTransactionDetails = function (charge, events) {
            response(req.headers.accept, res, 'transaction_details', transactionView.buildPaymentView(charge, events));
        };

        connectorClient().withGetCharge(gatewayAccountId, chargeId,
            function (charge) { //on success of finding a charge
                connectorClient().withChargeEvents(gatewayAccountId, chargeId,
                    function (events) { //on success of finding events for charge
                        showTransactionDetails(charge, events);
                    })
                    .on('connectorError', showError)
            }).on('connectorError', showError);
    });
};