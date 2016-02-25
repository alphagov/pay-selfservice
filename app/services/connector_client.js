'use strict';
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var logger = require('winston');
var requestClientInstance = require('../services/client_factory.js').requestClientInstance;
var dates = require('../utils/dates.js');
var querystring = require('querystring');

var CHARGES_API_PATH = '/v1/api/accounts/{accountId}/charges';
var CHARGE_API_PATH = CHARGES_API_PATH + '/{chargeId}';

var CONTENT_TYPE_CSV = 'text/csv';

var createResponseHandler = function(self) {
    return function(callback) {
        return function (error, response, body) {

            if (error || (response.statusCode !== 200)) {
                var errorMessage = '';
                if (error) {
                    errorMessage = 'Error while accessing connector, error: ' + JSON.stringify(error);
                } else {
                    errorMessage = 'Error from connector, status code: ' + response.statusCode;
                }
                logger.error(errorMessage);
                self.emit('connectorError', error, response, body);
                return;
            }

            callback(body);
        }
    }
};

var createOnResponseEventHandler = function (self) {
    return function (response) {

        if (response.statusCode === 200) {
            return;
        }
        logger.error('Error from connector, status code: ' + response.statusCode);

        //
        // Necessary when streaming a response
        // @See https://github.com/request/request/issues/1268
        //
        this.abort();

        self.emit('connectorError', null, response);
    }
};

var createOnErrorEventHandler = function (self) {
    return function (error) {
        logger.error('Error while accessing connector, ' + JSON.stringify(error));
        self.emit('connectorError', error, null);
    }
};

var ConnectorClient = function (connectorUrl) {
    this.connectorUrl = connectorUrl;
    this.client = requestClientInstance();
    this.responseHandler = createResponseHandler(this);
    this.onResponseEventHandler = createOnResponseEventHandler(this);
    this.onErrorEventHandler = createOnErrorEventHandler(this);

    EventEmitter.call(this);
};

util.inherits(ConnectorClient, EventEmitter);

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
    this.client(url, this.responseHandler(successCallback));
    return this;
};

/**
 * Download transaction list for a given gateway account id.
 * @param gatewayAccountId
 * @returns {ConnectorClient}
 */
ConnectorClient.prototype.withTransactionDownload = function (gatewayAccountId, searchParameters, successCallback) {
    var url = this._searchTransactionsUrlFor(gatewayAccountId, searchParameters);
    logger.info('CONNECTOR GET ' + url);

    var options = {
        url: url,
        headers: {
            'Accept': CONTENT_TYPE_CSV
        }
    };

    this.client(options)
        .on('error', this.onErrorEventHandler)
        .on('response', this.onResponseEventHandler)
        .pipe(successCallback());
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
    this.client(url, this.responseHandler(successCallback));
    return this;
};

/**
 * Retrives transaction history for a given charge Id that belongs to a gateway account Id.
 * @param gatewayAccountId
 * @param chargeId
 * @param successCallback the callback to perform upon `200 OK` from connector along with history result set.
 * @returns {ConnectorClient}
 */
ConnectorClient.prototype.withChargeEvents = function (gatewayAccountId, chargeId, successCallback) {
    var url = this._chargeUrlFor(gatewayAccountId, chargeId) + "/events";
    logger.info('CONNECTOR GET ' + url);
    this.client(url, this.responseHandler(successCallback));
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
