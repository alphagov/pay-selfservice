'use strict';
var _ = require('lodash');
var util                  = require('util');
var EventEmitter          = require('events').EventEmitter;
var logger                = require('winston');
var request               = require('request');
var dates                 = require('../../utils/dates.js');
var querystring           = require('querystring');
var withCorrelationHeader = require('../../utils/correlation_header.js').withCorrelationHeader;

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
var ACCOUNT_NOTIFICATION_CREDENTIALS_PATH = '/v1/api/accounts' + '/{accountId}' + '/notification-credentials';
var ACCOUNT_CREDENTIALS_PATH = ACCOUNT_FRONTEND_PATH + '/credentials';
var EMAIL_NOTIFICATION__PATH = '/v1/api/accounts/{accountId}/email-notification';

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

      callback(body, response);
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

/** @private */
function _accountUrlFor(gatewayAccountId, url) {
  return url + ACCOUNT_FRONTEND_PATH.replace("{accountId}", gatewayAccountId);
}

/** @private */
function _accountNotificationCredentialsUrlFor(gatewayAccountId, url) {
  return url + ACCOUNT_NOTIFICATION_CREDENTIALS_PATH.replace("{accountId}", gatewayAccountId);
}

/** @private */
function _accountCredentialsUrlFor(gatewayAccountId, url) {
  return url + ACCOUNT_CREDENTIALS_PATH.replace("{accountId}", gatewayAccountId);
}

/** @private */
function _accountAcceptedCardTypesUrlFor(gatewayAccountId, url) {
  return url + ACCEPTED_CARD_TYPES_FRONTEND_PATH.replace("{accountId}", gatewayAccountId);
}

/** @private */
function _cardTypesUrlFor(url) {
  return url + CARD_TYPES_API_PATH;
}

/** @private */
function _serviceNameUrlFor(gatewayAccountId, url) {
  return url + SERVICE_NAME_FRONTEND_PATH.replace("{accountId}", gatewayAccountId);
}

/** @private */
function _chargeUrlFor(gatewayAccountId, chargeId, url) {
  return url + CHARGE_API_PATH.replace("{accountId}", gatewayAccountId).replace("{chargeId}", chargeId);
}

/** @private */
function _chargeRefundsUrlFor(gatewayAccountId, chargeId, url) {
  return url + CHARGE_REFUNDS_API_PATH.replace("{accountId}", gatewayAccountId).replace("{chargeId}", chargeId);
}

/** @private */
var _getNotificationEmailUrlFor = function(accountID){
  return process.env.CONNECTOR_URL + EMAIL_NOTIFICATION__PATH.replace("{accountId}", accountID);
};

function _options(url) {
  return {
    url: url
  }
}

function getQueryStringForParams(params) {
  return querystring.stringify({
    reference: params.reference,
    email: params.email,
    state: params.state,
    card_brand: params.brand,
    from_date: dates.fromDateToApiFormat(params.fromDate, params.fromTime),
    to_date: dates.toDateToApiFormat(params.toDate, params.toTime),
    page: params.page || 1,
    display_size: params.pageSize || 100
  });
}

function searchUrl(baseUrl, params) {
  return baseUrl + CHARGES_API_PATH.replace("{accountId}", params.gatewayAccountId) + "?" + getQueryStringForParams(params);

}

/**
 * Connects to connector
 * @param {string} connectorUrl connector url
 */
function ConnectorClient(connectorUrl) {
  this.connectorUrl = connectorUrl;
  this.client = request.defaults({json: true});
  this.responseHandler = _createResponseHandler(this);

  EventEmitter.call(this);
}

ConnectorClient.prototype = {
  /**
   *
   * @param params
   * @param successCallback
   * @returns {ConnectorClient}
   */
  searchTransactions (params, successCallback) {
    var query = getQueryStringForParams(params);
    logger.debug('Calling connector to search account transactions -', {
      service: 'connector',
      method: 'GET',
      url: this.connectorUrl + CHARGES_API_PATH,
      queryParams: query
    });
    var startTime = new Date();

    //allow url to be overridden to allow recursion using next url
    var url = params.url || searchUrl(this.connectorUrl, params);
    var responseHandler = this.responseHandler(successCallback);
    this.client.get(withCorrelationHeader(_options(url), params.correlationId), function(error, response, body) {
      logger.info(`[${params.correlationId}] - GET to %s ended - elapsed time: %s ms`, url,  new Date() - startTime);
      responseHandler(error, response, body);
    });
    return this;
  },

  /**
   *
   * @param params
   * @param successCallback
   * @returns {ConnectorClient}
   */
  getAllTransactions (params, successCallback) {
    var results = [];
    var connectorClient = this;

    var recursiveRetrieve = function(recursiveParams) {

      connectorClient.searchTransactions(recursiveParams, function (data) {
        var next = _.get(data, "_links.next_page");
        results = results.concat(data.results);
        if (next === undefined) return successCallback(results);

        recursiveParams.url = next.href;
        recursiveRetrieve(recursiveParams);
      });
    };

    recursiveRetrieve(params);

    return this;
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
  getCharge: function (params, successCallback) {
    var url = _chargeUrlFor(params.gatewayAccountId, params.chargeId, this.connectorUrl);
    logger.debug('Calling connector to get charge -', {
      service: 'connector',
      method: 'GET',
      url: url,
      chargeId: params.chargeId
    });
    this.client.get(withCorrelationHeader(_options(url), params.correlationId), this.responseHandler(successCallback));
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
  getChargeEvents: function (params, successCallback) {
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
  getAccount: function (params, successCallback) {
    var url = _accountUrlFor(params.gatewayAccountId, this.connectorUrl);

    logger.debug('Calling connector to get account -', {
      service: 'connector',
      method: 'GET',
      url: url
    });
    this.client.get(withCorrelationHeader(_options(url), params.correlationId), this.responseHandler(successCallback));
    return this;
  },

  /**
   *
   * @param {Object} params
   * @param {Function} successCallback
   * @returns {ConnectorClient}
   */
  patchAccountCredentials: function (params, successCallback) {
    var url = _accountCredentialsUrlFor(params.gatewayAccountId, this.connectorUrl);

    logger.debug('Calling connector to get account -', {
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
   *
   * @param {Object} params
   * @param {Function} successCallback
   * @returns {ConnectorClient}
   */
  postAccountNotificationCredentials: function (params, successCallback) {
    var url = _accountNotificationCredentialsUrlFor(params.gatewayAccountId, this.connectorUrl);

    logger.debug('Calling connector to get account -', {
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
   * Retrieves the accepted payment types for the given account
   * @param params
   *          An object with the following elements;
   *            gatewayAccountId (required)
   *            correlationId (optional)
   * @param successCallback
   *          Callback function upon retrieving accepted cards successfully
   */
  getAcceptedCardsForAccount: function (params, successCallback) {
    var url = _accountAcceptedCardTypesUrlFor(params.gatewayAccountId, this.connectorUrl);
    logger.debug('Calling connector to get accepted card types for account -', {
      service: 'connector',
      method: 'GET',
      url: url
    });
    this.client.get(withCorrelationHeader(_options(url), params.correlationId), this.responseHandler(successCallback));
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
  postAcceptedCardsForAccount: function (params, successCallback) {
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
  getAllCardTypes: function (params, successCallback) {
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
    this.client.get(withCorrelationHeader(_options(url), correlationParams.correlationId), this.responseHandler(successCallback));
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
  patchServiceName: function (params, successCallback) {
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
  postChargeRefund: function (params, successCallback) {
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
  },

  /**
   *
   * @param {Object} params
   * @param {Function} successCallback
   */
  getNotificationEmail: function(params, successCallback) {
    var url = _getNotificationEmailUrlFor(params.gatewayAccountId);
    this.client.get(withCorrelationHeader(_options(url), params.correlationId), this.responseHandler(successCallback));

    return this;
  },

  /**
   *
   * @param {Object} params
   * @param {Function} successCallback
   */
  updateNotificationEmail: function(params, successCallback) {
    var url = _getNotificationEmailUrlFor(params.gatewayAccountId);

    var options = _options(url);
    options.body = params.payload;
    this.client.post(withCorrelationHeader(options, params.correlationId), this.responseHandler(successCallback));

    return this;
  },

  /**
   *
   * @param {Object} params
   * @param {Function} successCallback
   */
  updateNotificationEmailEnabled: function(params, successCallback) {
    var url = _getNotificationEmailUrlFor(params.gatewayAccountId);

    var options = _options(url);
    options.body = params.payload;
    this.client.patch(withCorrelationHeader(options, params.correlationId), this.responseHandler(successCallback));

    return this;
  }
};

util.inherits(ConnectorClient, EventEmitter);

module.exports.ConnectorClient = ConnectorClient;
