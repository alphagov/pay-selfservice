'use strict';
var util                  = require('util');
var EventEmitter          = require('events').EventEmitter;
var logger                = require('winston');
var request               = require('request');
var dates                 = require('../utils/dates.js');
var querystring           = require('querystring');
var withCorrelationHeader = require('../utils/correlation_header.js').withCorrelationHeader;

var ACCOUNTS_API_PATH                 = '/v1/api/accounts';
var ACCOUNT_API_PATH                  = ACCOUNTS_API_PATH + '/{accountId}';
var CHARGES_API_PATH                  = ACCOUNT_API_PATH + '/charges';
var CHARGE_API_PATH                   = CHARGES_API_PATH + '/{chargeId}';
var CHARGE_REFUNDS_API_PATH           = CHARGE_API_PATH + '/refunds';
var CARD_TYPES_API_PATH               = '/v1/api/card-types';

var ACCOUNTS_FRONTEND_PATH            = '/v1/frontend/accounts';
var ACCOUNT_FRONTEND_PATH             = ACCOUNTS_FRONTEND_PATH + '/{accountId}';
var SERVICE_NAME_FRONTEND_PATH        = ACCOUNT_FRONTEND_PATH + '/servicename';
var ACCEPTED_CARD_TYPES_FRONTEND_PATH = ACCOUNT_FRONTEND_PATH + '/card-types';

/**
 * @private
 * @param  {object}
 */
function _createResponseHandler(self) {
  return function (callback) {
    return function (error, response, body) {
      if (error || !isInArray(response.statusCode, [200, 202])) {
        if (error) {
          logger.error('Calling connector error -', {
            service: 'connector',
            error: JSON.stringify(error)});
        } else {
          logger.error('Calling connector response failed -', {
            service: 'connector',
            status: response.statusCode
          });
        }
        self.emit('connectorError', error, response, body);
        return;
      }

      callback(body);
    }
  }
}

/**
 * @private
 * @param  {Object} value - value to find into the array
 * @param {Object[]} array - array source for finding the given value
 */
function isInArray(value, array) {
  return array.indexOf(value) > -1;
}

/**
 * @private
 * @param  {object}
 */
function _createOnResponseEventHandler(self) {
  return function (response) {

    if (response.statusCode === 200) {
      return;
    }

    logger.error('Calling connector failed -', {
      service:'connector',
      status: response.statusCode
    });
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
function _createOnErrorEventHandler(self) {
  return function (error) {
    logger.error('Calling connector failed -', {
      service: 'connector',
      error: JSON.stringify(error)
    });
    self.emit('connectorError', error, null);
  }
}

/** @private */
function _accountUrlFor(gatewayAccountId, url) {
  console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> _accountUrlFor ' + gatewayAccountId, url);
  return url + ACCOUNT_FRONTEND_PATH.replace("{accountId}", gatewayAccountId);
};

/** @private */
function _accountAcceptedCardTypesUrlFor(gatewayAccountId, url) {
  return url + ACCEPTED_CARD_TYPES_FRONTEND_PATH.replace("{accountId}", gatewayAccountId);
};

/** @private */
function _cardTypesUrlFor(url) {
  return url + CARD_TYPES_API_PATH;
}

/** @private */
function _serviceNameUrlFor(gatewayAccountId, url) {
  console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> _serviceNameUrlFor ' + gatewayAccountId, url);
  return url + SERVICE_NAME_FRONTEND_PATH.replace("{accountId}", gatewayAccountId);
};

/** @private */
function _chargeUrlFor(gatewayAccountId, chargeId, url) {
  return url + CHARGE_API_PATH.replace("{accountId}", gatewayAccountId).replace("{chargeId}", chargeId);
}

/** @private */
function _chargeRefundsUrlFor(gatewayAccountId, chargeId, url) {
  return url + CHARGE_REFUNDS_API_PATH.replace("{accountId}", gatewayAccountId).replace("{chargeId}", chargeId);
}

function _options(url) {
  return {
    url: url
  }
}

/**
 * Connects to connector
 * @param {string} connectorUrl connector url
 */
function ConnectorClient(connectorUrl) {
  this.connectorUrl = connectorUrl;
  this.client = request.defaults({json: true});
  this.responseHandler = _createResponseHandler(this);
  this.onResponseEventHandler = _createOnResponseEventHandler(this);
  this.onErrorEventHandler = _createOnErrorEventHandler(this);

  EventEmitter.call(this);
}

ConnectorClient.prototype = {

  withSearchTransactionsUrl (gatewayAccountId, searchParameters) {
    var query = querystring.stringify({
      reference: searchParameters.reference,
      email: searchParameters.email,
      state: searchParameters.state,
      card_brand: searchParameters.brand,
      from_date: dates.fromDateToApiFormat(searchParameters.fromDate, searchParameters.fromTime),
      to_date: dates.toDateToApiFormat(searchParameters.toDate, searchParameters.toTime),
      page: searchParameters.page || 1,
      display_size: searchParameters.pageSize || 100
    });
    logger.debug('Calling connector to search account transactions -', {
      service: 'connector',
      method: 'GET',
      url: this.connectorUrl + CHARGES_API_PATH,
      queryParams: query
    });
    return this.connectorUrl + CHARGES_API_PATH.replace("{accountId}", gatewayAccountId) + "?" + query;
  },

  /**
   * Retrieves a Charge from connector for a given charge Id that belongs to a gateway account Id
   * @param params
   *          An object with the following elements;
   *            gatewayAccountId (required)
   *            chargeId (required)
   *            correlationId (optional)
   * @param successCallback the callback to perform upon `200 OK` from connector along with connector charge object.
   *
   * @returns {ConnectorClient}
   */
  withGetCharge: function (params, successCallback) {
    var url = _chargeUrlFor(params.gatewayAccountId, params.chargeId, this.connectorUrl);
    logger.debug('Calling connector to get charge -', {
      service: 'connector',
      method: 'GET',
      url: url,
      chargeId: params.chargeId
    });
    this.client(withCorrelationHeader(_options(url), params.correlationId), this.responseHandler(successCallback));
    return this;
  },

  /**
   * Retrieves transaction history for a given charge Id that belongs to a gateway account Id.
   * @param params
   *          An object with the following elements;
   *            gatewayAccountId (required)
   *            chargeId (required)
   *            correlationId (optional)
   * @param successCallback the callback to perform upon `200 OK` from connector along with history result set.
   * @returns {ConnectorClient}
   */
  withChargeEvents: function (params, successCallback) {
    var url = _chargeUrlFor(params.gatewayAccountId, params.chargeId, this.connectorUrl) + "/events";
    logger.debug('Calling connector to get events -', {
      service: 'connector',
      method: 'GET',
      url: url,
      chargeId: params.chargeId
    });
    this.client(withCorrelationHeader(_options(url), params.correlationId), this.responseHandler(successCallback));
    return this;
  },

  /**
   * Retrieves the given gateway account
   * @param params
   *          An object with the following elements;
   *            gatewayAccountId (required)
   *            correlationId (optional)
   * @param successCallback
   *          Callback function for successful refunds
   */
  withGetAccount: function (params, successCallback) {
    console.log('calling withGetAccount');
    var url = _accountUrlFor(params.gatewayAccountId, this.connectorUrl);

    logger.debug('Calling connector to get account -', {
      service: 'connector',
      method: 'GET',
      url: url
    });
    this.client(withCorrelationHeader(_options(url), params.correlationId), this.responseHandler(successCallback));
    return this;
  },

  /**
   * Retrieves the accepted payment types for the given account
   * @param params
   *          An object with the following elements;
   *            gatewayAccountId (required)
   *            correlationId (optional)
   * @param successCallback
   *          Callback function upon retrieving accepted cards successfully
   */
  withGetAccountAcceptedCards: function (params, successCallback) {
    var url = _accountAcceptedCardTypesUrlFor(params.gatewayAccountId, this.connectorUrl);
    logger.debug('Calling connector to get accepted card types for account -', {
      service: 'connector',
      method: 'GET',
      url: url
    });
    this.client(withCorrelationHeader(_options(url), params.correlationId), this.responseHandler(successCallback));
    return this;
  },

  /**
   * Updates the accepted payment types for to the given gateway account
   * @param params
   *          An object with the following elements;
   *            gatewayAccountId (required)
   *            payload (required)
   *            correlationId (optional)
   * @param successCallback
   *          Callback function upon saving accepted cards successfully
   */
  withPostAccountAcceptedCards: function (params, successCallback) {
    var url = _accountAcceptedCardTypesUrlFor(params.gatewayAccountId, this.connectorUrl);
    logger.debug('Calling connector to post accepted card types for account -', {
      service: 'connector',
      method: 'POST',
      url: url
    });
    var options = _options(url);
    options.body = params.payload;

    this.client.post(withCorrelationHeader(options, params.correlationId), this.responseHandler(successCallback));
    return this;
  },

  /**
   * Retrieves all card types
   * @param params (optional)
   *          And object with the following elements;
   *            correlationId
   * @param successCallback
   *          Callback function upon successful card type retrieval
   */
  withGetAllCardTypes: function (params, successCallback) {
    var correlationParams = {};
    if(typeof params === "function") {
      successCallback = params;
    } else {
      correlationParams = params;
    }

    var url = _cardTypesUrlFor(this.connectorUrl);
    logger.debug('Calling connector to get all card types -', {
      service: 'connector',
      method: 'GET',
      url: url
    });
    this.client(withCorrelationHeader(_options(url), correlationParams.correlationId), this.responseHandler(successCallback));
    return this;
  },

  /**
   * Updates the service name for to the given gateway account
   * @param params
   *          An object with the following elements;
   *            gatewayAccountId (required)
   *            payload (required)
   *            correlationId (optional)
   * @param successCallback
   *          Callback function for successful patching of service name
   */
  withPatchServiceName: function (params, successCallback) {
    var url = _serviceNameUrlFor(params.gatewayAccountId, this.connectorUrl);
    logger.debug('Calling connector to update service name -', {
      service: 'connector',
      method: 'PATCH',
      url: url
    });

    var options = _options(url);
    options.body = params.payload;
    this.client.patch(withCorrelationHeader(options, params.correlationId), this.responseHandler(successCallback));
    return this;
  },

  /**
   * Create a refund of the provided amount for the given payment
   * @param params
   *          An object with the following elements;
   *            gatewayAccountId (required)
   *            chargeId (required)
   *            payload (required)
   *            correlationId (optional)
   * @param successCallback
   *          Callback function for successful refunds
   */
  withPostChargeRefund: function (params, successCallback) {
    var url = _chargeRefundsUrlFor(params.gatewayAccountId, params.chargeId, this.connectorUrl);
    logger.debug('Calling connector to post a refund for payment -', {
      service: 'connector',
      method: 'POST',
      url: url,
      chargeId: params.chargeId,
      payload: params.payload
    });

    var options = _options(url);
    options.body = params.payload;

    this.client.post(withCorrelationHeader(options, params.correlationId), this.responseHandler(successCallback));
    return this;
  }
};

util.inherits(ConnectorClient, EventEmitter);

module.exports.ConnectorClient = ConnectorClient;
