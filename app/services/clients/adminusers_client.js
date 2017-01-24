const q = require('q');
const _ = require('lodash');
const requestLogger = require('../../utils/request_logger');
const baseClient = require('./base_client');

const SERVICE_NAME = 'adminusers';
const SUCCESS_CODES = [200, 201, 202, 204, 206];

/**
 * @param {string} accountId
 */
const BASE_USER_URL = `${process.env.ADMINUSERS_URL}/v1/api/users`;

/**
 * Creates a callback that can be used to log the stuff we're interested
 * in and converts the response/error into a promise.
 *
 * @private
 * @param {Object} context
 * @returns {function}
 */
const createCallbackToPromiseConverter = context => {
  let defer = context.defer;
  context.service = SERVICE_NAME;

  return (error, response, body) => {
    requestLogger.logRequestEnd(context);

    if (response && SUCCESS_CODES.indexOf(response.statusCode) === -1) {
      requestLogger.logRequestFailure(context, response);
      defer.reject({response: response});
    }

    if (error) {
      requestLogger.logRequestError(context, error);
      defer.reject({error: error});
    }

    defer.resolve(body);
  };
};

module.exports = {
  /**
   * Create user
   *
   * Expects {
   *  accountId: accountId,
   *  correlationId: correlationId,
   *  payload: user
   * }
   *
   * @param {Object} params
   * @returns {Promise}
   */
  createUser: (params) => {
    let url = BASE_USER_URL;
    let defer = q.defer();
    let startTime = new Date();
    let context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: params.correlationId,
      method: 'POST',
      description: 'create a user',
    };

    let callbackToPromiseConverter = createCallbackToPromiseConverter(context);

    requestLogger.logRequestStart(context);

    baseClient.post(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;
  },

  /**
   * find a user by username
   *  Expects {
   *    username: accountId,
   *    correlationId: correlationId,
   *  }
   */
  getUser: (params) => {
    let url = `${BASE_USER_URL}/${params.username}`;
    let defer = q.defer();
    let startTime = new Date();
    let context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: params.correlationId,
      method: 'GET',
      description: 'find a user',
    };

    let callbackToPromiseConverter = createCallbackToPromiseConverter(context);

    requestLogger.logRequestStart(context);

    baseClient.get(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;
  }

};
