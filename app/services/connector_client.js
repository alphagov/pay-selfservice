'use strict';
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var logger = require('winston');
var request = require('request');
var dates = require('../utils/dates.js');
var querystring = require('querystring');
var ACCOUNTS_API_PATH = '/v1/api/accounts';
var ACCOUNT_API_PATH = ACCOUNTS_API_PATH + '/{accountId}';
var CHARGES_API_PATH = ACCOUNT_API_PATH + '/charges';
var CHARGE_API_PATH = CHARGES_API_PATH + '/{chargeId}';
var ACCOUNTS_FRONTEND_PATH = '/v1/frontend/accounts';
var ACCOUNT_FRONTEND_PATH = ACCOUNTS_FRONTEND_PATH + '/{accountId}';
var SERVICE_NAME_FRONTEND_PATH = ACCOUNT_FRONTEND_PATH + '/servicename';

/**
 * @private
 * @param  {object} 
 */
function _createResponseHandler (self) {
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
}

/**
 * @private
 * @param  {object}
 */
function _createOnResponseEventHandler (self) {
    return function (response) {

        if (response.statusCode === 200) {
            return;
        }
        logger.error('Error from connector, status code: ' + response.statusCode);

        //
        // Necessary when streaming a response
        // @See https://github  .com/request/request/issues/1268
        //
        this.abort();

        self.emit('connectorError', null, response);
    }
}

/**
 * @private
 */
function _createOnErrorEventHandler (self) {
    return function (error) {
        logger.error('Error while accessing connector, ' + JSON.stringify(error));
        self.emit('connectorError', error, null);
    }
}

/** @private */
function _accountUrlFor (gatewayAccountId, url) {
    return url + ACCOUNT_FRONTEND_PATH.replace("{accountId}", gatewayAccountId);
};

/** @private */
function _serviceNameUrlFor (gatewayAccountId, url) {
    return url + SERVICE_NAME_FRONTEND_PATH.replace("{accountId}", gatewayAccountId);
};

/** @private */
function _chargeUrlFor (gatewayAccountId, chargeId, url) {
    return url + CHARGE_API_PATH.replace("{accountId}", gatewayAccountId).replace("{chargeId}", chargeId);
};

/**
 * Connects to connector
 * @param {string} connectorUrl connector url
 */
function ConnectorClient (connectorUrl) {
    this.connectorUrl = connectorUrl;
    this.client = request.defaults({json:true});
    this.responseHandler = _createResponseHandler(this);
    this.onResponseEventHandler = _createOnResponseEventHandler(this);
    this.onErrorEventHandler = _createOnErrorEventHandler(this);

    EventEmitter.call(this);
};

ConnectorClient.prototype = {
    /**
     * Retrieves transaction list for a given gateway account id.
     * @param gatewayAccountId
     * @param successCallback the callback to perform upon `200 OK` along with the connector results.
     * @returns {ConnectorClient}
     */
    withTransactionList: function (gatewayAccountId, searchParameters, successCallback) {
        var url = this.withSearchTransactions(gatewayAccountId, searchParameters, this.connectorUrl);
        logger.info('CONNECTOR GET ' + url);
        this.client(url, this.responseHandler(successCallback));
        return this;
    },
    
    withSearchTransactions (gatewayAccountId, searchParameters) {
    var query = querystring.stringify({
        reference: searchParameters.reference,
        state: searchParameters.state,
        from_date: dates.userInputToApiFormat(searchParameters.fromDate),
        to_date: dates.userInputToApiFormat(searchParameters.toDate),
        page: searchParameters.page || 1,
        display_size: searchParameters.pageSize || 100
    });

    return this.connectorUrl + CHARGES_API_PATH.replace("{accountId}", gatewayAccountId) +"?" + query;
  },

    /**
     * Retrieves a Charge from connector for a given charge Id that belongs to a gateway account Id
     * @param gatewayAccountId
     * @param chargeId
     * @param successCallback the callback to perform upon `200 OK` from connector along with connector charge object.
     * @returns {ConnectorClient}
     */
    withGetCharge: function (gatewayAccountId, chargeId, successCallback) {
        var url = _chargeUrlFor(gatewayAccountId, chargeId, this.connectorUrl);
        logger.info('CONNECTOR GET ' + url);
        this.client(url, this.responseHandler(successCallback));
        return this;
    },

    /**
     * Retrieves transaction history for a given charge Id that belongs to a gateway account Id.
     * @param gatewayAccountId
     * @param chargeId
     * @param successCallback the callback to perform upon `200 OK` from connector along with history result set.
     * @returns {ConnectorClient}
     */
    withChargeEvents: function (gatewayAccountId, chargeId, successCallback) {
        var url = _chargeUrlFor(gatewayAccountId, chargeId, this.connectorUrl) + "/events";
        logger.info('CONNECTOR GET ' + url);
        this.client(url, this.responseHandler(successCallback));
        return this;
    },

    /**
     * Retrieves the service name for the given gateway account
     * @param gatewayAccountId
     */
    withGetAccountServiceName: function (gatewayAccountId, successCallback) {
        var url = _accountUrlFor(gatewayAccountId, this.connectorUrl);
        logger.info('CONNECTOR GET ' + url);
        this.client(url, this.responseHandler(successCallback));
        return this;
    },

    /**
     * Updates the service name for to the given gateway account
     * @param gatewayAccountId
     */
    withPatchServiceName: function (gatewayAccountId, payload, successCallback) {
        var url = _serviceNameUrlFor(gatewayAccountId, this.connectorUrl);
        logger.info('CONNECTOR PUT ' + url);
        this.client.patch({url: url, body: payload}, this.responseHandler(successCallback));
        return this;
    }
};

util.inherits(ConnectorClient, EventEmitter);

module.exports.ConnectorClient = ConnectorClient;
