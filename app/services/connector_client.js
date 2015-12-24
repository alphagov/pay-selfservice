var logger = require('winston');
var Client = require('node-rest-client').Client;

var CHARGE_API_PATH = '/v1/api/accounts/{accountId}/charges/{chargeId}';
var FRONTEND_CHARGE_PATH = '/v1/frontend/charges';


var ConnectorClient = function (connectorUrl) {
    this.connectorUrl = connectorUrl;
    this.client = new Client();
};

ConnectorClient.prototype.connectorUrl = null;
ConnectorClient.prototype.client = null;

ConnectorClient.prototype.getCharge = function (gatewayAccountId, chargeId, successCallback, errCallback) {

    var chargeUrl = this._chargeUrlFor(gatewayAccountId, chargeId);
    logger.info('CONNECTOR GET ' + chargeUrl);

    this.client.get(chargeUrl, function (connectorData, connectorResponse) {
        if (connectorResponse.statusCode === 200) {
            successCallback(connectorData);
        } else {
            logger.error('Error from connector:' + connectorData.message);
            errCallback(connectorData.message, connectorResponse);
        }
    }).on('error', function (err) {
        logger.error('Exception raised calling connector:' + err);
        errCallback(err);
    });

};

ConnectorClient.prototype.getTransactionList = function (gatewayAccountId, successCallback, errCallback) {
    var transactionsUrl = this._transactionUrlFor(gatewayAccountId);
    logger.info('CONNECTOR GET ' + transactionsUrl);

    this.client.get(transactionsUrl, function (connectorData, connectorResponse) {
        if (connectorResponse.statusCode === 200) {
            successCallback(connectorData);
        } else {
            logger.error('Error from connector:' + connectorData.message);
            errCallback(connectorData.message, connectorResponse);
        }
    }).on('error', function (err) {
        logger.error('Error raised calling connector:' + err);
        errCallback(err);
    });
};

ConnectorClient.prototype.getChargeEvents = function (gatewayAccountId, chargeId, successCallback, errCallback) {

    var eventUrl = this._chargeUrlFor(gatewayAccountId, chargeId) + "/events";
    logger.info('CONNECTOR GET ' + eventUrl);

    this.client.get(eventUrl, function (connectorData, connectorResponse) {
        if (connectorResponse.statusCode === 200) {
            successCallback(connectorData);
        } else {
            logger.error('Error from connector:' + connectorData.message);
            errCallback(connectorData.message, connectorResponse);
        }
    }).on('error', function (err) {
        logger.error('Exception raised calling connector:' + err);
        errCallback(err);
    });
};

ConnectorClient.prototype._chargeUrlFor = function (gatewayAccountId, chargeId) {
    return this.connectorUrl + CHARGE_API_PATH.replace("{accountId}", gatewayAccountId).replace("{chargeId}", chargeId);
};

ConnectorClient.prototype._transactionUrlFor = function (gatewayAccountId) {
    return this.connectorUrl + FRONTEND_CHARGE_PATH + '?gatewayAccountId=' + gatewayAccountId;
};

exports.ConnectorClient = ConnectorClient;