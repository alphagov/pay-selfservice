'use strict';
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var logger = require('winston');
var request = require('request');
var dates = require('../utils/dates.js');
var querystring = require('querystring');


var CHARGES_API_PATH = '/v1/api/accounts/{accountId}/charges';
var CHARGE_API_PATH = CHARGES_API_PATH + '/{chargeId}';

var ConnectorClient = function (connectorUrl) {
    this.connectorUrl = connectorUrl;
    this.client = request.defaults({json:true});
    EventEmitter.call(this);
};

util.inherits(ConnectorClient, EventEmitter);

var getResponseHandler = function(callback) {
    return function (error, response, body) {
        if (error) {
            logger.error('Error from connector: ' + error);
            this.emit('connectorError', error, response, body);
            return;
        }

        if (response.statusCode === 200) {
            callback(body);
        } else {
            logger.error('Error from connector with status code: ' + response.statusCode);
            this.emit('connectorError', error, response, body);
        }
    }
};

ConnectorClient.prototype.connectorUrl = null;

ConnectorClient.prototype.client = null;

/**
 * Retrieves transaction list for a given gateway account id.
 * @param gatewayAccountId
 * @param successCallback the callback to perform upon `200 OK` along with the connector results.
 * @returns {ConnectorClient}
 */
ConnectorClient.prototype.withTransactionList = function (gatewayAccountId, searchParameters, successCallback) {
    var url = this._searchTransactionsUrlFor(gatewayAccountId, searchParameters);
    logger.info('CONNECTOR GET ' + url);
    this.client(url, getResponseHandler(successCallback).bind(this));
    return this;
};

/**
 * Download transaction list for a given gateway account id.
 * @param gatewayAccountId
 * @returns {ConnectorClient}
 */
ConnectorClient.prototype.withTransactionDownload = function (gatewayAccountId, searchParameters, response) {
    var url = this._searchTransactionsUrlFor(gatewayAccountId, searchParameters);
    logger.info('CONNECTOR GET ' + url);
    this.client(url).pipe(response);
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
    var url = this._chargeUrlFor(gatewayAccountId, chargeId);
    logger.info('CONNECTOR GET ' + url);
    this.client(url, getResponseHandler(successCallback).bind(this));
    return this;
};

/**
 * Retrives transaction history for a given charge Id that belongs to a gateway account Id.
 * @param gatewayAccountId
 * @param chargeId
 * @param successCallback the callback to perform upon `200 OK` from connector along with history resultset.
 * @returns {ConnectorClient}
 */
ConnectorClient.prototype.withChargeEvents = function (gatewayAccountId, chargeId, successCallback) {
    var url = this._chargeUrlFor(gatewayAccountId, chargeId) + "/events";
    logger.info('CONNECTOR GET ' + url);
    this.client(url, getResponseHandler(successCallback).bind(this));
    return this;
};

ConnectorClient.prototype._chargeUrlFor = function (gatewayAccountId, chargeId) {
    return this.connectorUrl + CHARGE_API_PATH.replace("{accountId}", gatewayAccountId).replace("{chargeId}", chargeId);
};

ConnectorClient.prototype._transactionUrlFor = function (gatewayAccountId) {
    return this.connectorUrl + FRONTEND_CHARGE_PATH + '?gatewayAccountId=' + gatewayAccountId;
};

ConnectorClient.prototype._searchTransactionsUrlFor = function (gatewayAccountId, searchParameters) {

    var query = querystring.stringify({
        reference: searchParameters.reference,
        status: searchParameters.status,
        from_date: dates.userInputToApiFormat(searchParameters.fromDate),
        to_date: dates.userInputToApiFormat(searchParameters.toDate)
    });

    return this.connectorUrl + CHARGES_API_PATH.replace("{accountId}", gatewayAccountId) +"?" + query;
};

exports.ConnectorClient = ConnectorClient;