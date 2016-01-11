'use strict';
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var logger = require('winston');
var Client = require('node-rest-client').Client;

var CHARGE_API_PATH = '/v1/api/accounts/{accountId}/charges/{chargeId}';
var FRONTEND_CHARGE_PATH = '/v1/frontend/charges';


var ConnectorClient = function (connectorUrl) {
    this.connectorUrl = connectorUrl;
    this.client = new Client();
    EventEmitter.call(this);
};

util.inherits(ConnectorClient, EventEmitter);

ConnectorClient.prototype.connectorUrl = null;

ConnectorClient.prototype.client = null;

/**
 * Retrieves transaction list for a given gateway account id and search parameters
 * @param gatewayAccountId
 * @param searchParameters
 * @param successCallback the callback to perform upon `200 OK` along with the connector results.
 * @returns {ConnectorClient}
 */
ConnectorClient.prototype.withTransactionList = function (gatewayAccountId, searchParameters, successCallback) {
    var transactionsUrl = this._transactionUrlFor(gatewayAccountId, searchParameters);

    var self = this;
    logger.info('CONNECTOR GET ' + transactionsUrl);
    this.client.get(transactionsUrl, function (connectorData, connectorResponse) {
        if (connectorResponse.statusCode === 200) {
            successCallback(connectorData);
        } else {
            logger.error('Error from connector:' + connectorData.message);
            self.emit('connectorError', connectorData.message, connectorResponse);
        }
    }).on('error', function (err) {
        logger.error('Error raised calling connector:' + err);
        self.emit('connectorError', err);
    });
    return this;
};

/**
 * Retrieves a Charge from connector for a given charge Id that belongs to a gateway account Id
 * @param gatewayAccountId
 * @param chargeId
 * @param successCallback the callback to perform upon `200 OK` from connector along with connector charge object.
 * @returns {ConnectorClient}
 */
ConnectorClient.prototype.withGetCharge = function (gatewayAccountId, chargeId, successCallback) {
    var chargeUrl = this._chargeUrlFor(gatewayAccountId, chargeId);

    var self = this;
    logger.info('CONNECTOR GET ' + chargeUrl);
    this.client.get(chargeUrl, function (connectorData, connectorResponse) {
        if (connectorResponse.statusCode === 200) {
            successCallback(connectorData);
        } else {
            logger.error('Error from connector:' + connectorData.message);
            self.emit('connectorError', connectorData.message, connectorResponse);
        }
    }).on('error', function (err) {
        logger.error('Exception raised calling connector:' + err);
        self.emit('connectorError', err);
    });
    return this;
};

/**
 * Retrieves transaction history for a given charge Id that belongs to a gateway account Id.
 * @param gatewayAccountId
 * @param chargeId
 * @param successCallback the callback to perform upon `200 OK` from connector along with history resultset.
 * @returns {ConnectorClient}
 */
ConnectorClient.prototype.withChargeEvents = function (gatewayAccountId, chargeId, successCallback) {
    var eventUrl = this._chargeUrlFor(gatewayAccountId, chargeId) + "/events";

    var self = this;
    logger.info('CONNECTOR GET ' + eventUrl);
    this.client.get(eventUrl, function (connectorData, connectorResponse) {
        if (connectorResponse.statusCode === 200) {
            successCallback(connectorData);
        } else {
            logger.error('Error from connector:' + connectorData.message);
            self.emit('connectorError', connectorData.message, connectorResponse);
        }
    }).on('error', function (err) {
        logger.error('Exception raised calling connector:' + err);
        self.emit('connectorError', err);
    });
    return this;
};

ConnectorClient.prototype._chargeUrlFor = function (gatewayAccountId, chargeId) {
    return this.connectorUrl + CHARGE_API_PATH.replace("{accountId}", gatewayAccountId).replace("{chargeId}", chargeId);
};

ConnectorClient.prototype._transactionUrlFor = function (gatewayAccountId, searchParameters) {
    var queryStr = '?gatewayAccountId=' + gatewayAccountId;
    queryStr = searchParameters.reference ? queryStr+= '&reference=' + searchParameters.reference : queryStr;
    queryStr = searchParameters.status ? queryStr+= '&status=' + searchParameters.status  : queryStr;
    queryStr = searchParameters.fromDate ? queryStr+= '&fromDate=' + searchParameters.fromDate : queryStr;
    queryStr = searchParameters.toDate ? queryStr+= '&toDate=' + searchParameters.toDate : queryStr;
    return this.connectorUrl + FRONTEND_CHARGE_PATH + queryStr;
};

exports.ConnectorClient = ConnectorClient;