const q = require('q');
const _ = require('lodash');
const requestLogger = require('../../utils/request_logger');
const baseClient = require('./base_client');

const SERVICE_NAME = 'adminusers';
const SUCCESS_CODES = [200, 201, 202, 204, 206];
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
      defer.reject({
        errorCode: response.statusCode,
        message: response.body
      });
    }

    if (error) {
      requestLogger.logRequestError(context, error);
      defer.reject({error: error});
    }

    defer.resolve(body);
  };
};

module.exports = function (baseUrl) {

  var userResource = `${baseUrl}/v1/api/users`;
  var forgottenPasswordResource = `${baseUrl}/v1/api/forgotten-passwords`;

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
  let createUser = (params) => {
    let url = userResource;
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
  };

  /**
   * find a user by username
   *  Expects {
   *    username: accountId,
   *    correlationId: correlationId,
   *  }
   */
  let getUser = (params) => {
    let url = `${userResource}/${params.username}`;
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
  };

  let authenticateUser = (params) => {

    let url = `${userResource}/authenticate`;
    let defer = q.defer();
    let startTime = new Date();
    let context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: params.correlationId,
      method: 'POST',
      description: 'authenticate a user',
    };

    let callbackToPromiseConverter = createCallbackToPromiseConverter(context);

    requestLogger.logRequestStart(context);

    baseClient.post(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;

  };

  let incrementLoginAttemptsForUser = params => {
    let url = `${userResource}/${params.username}/attempt-login`;
    let defer = q.defer();
    let startTime = new Date();
    let context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: params.correlationId,
      method: 'POST',
      description: 'increment login attempts for a user',
    };

    let callbackToPromiseConverter = createCallbackToPromiseConverter(context);

    requestLogger.logRequestStart(context);

    baseClient.post(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;
  };

  let resetLoginAttemptsForUser = params => {
    let url = `${userResource}/${params.username}/attempt-login?action=reset`;
    let defer = q.defer();
    let startTime = new Date();
    let context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: params.correlationId,
      method: 'POST',
      description: 'reset login attempts for a user',
    };

    let callbackToPromiseConverter = createCallbackToPromiseConverter(context);

    requestLogger.logRequestStart(context);

    baseClient.post(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;
  };

  let incrementSessionVersionForUser = params => {
    let url = `${userResource}/${params.username}`;
    let defer = q.defer();
    let startTime = new Date();
    let context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: params.correlationId,
      method: 'PATCH',
      description: 'increment session version for a user',
    };

    let callbackToPromiseConverter = createCallbackToPromiseConverter(context);

    requestLogger.logRequestStart(context);

    baseClient.patch(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;
  };

  let createForgottenPassword = params => {
    let url = `${forgottenPasswordResource}`;
    let defer = q.defer();
    let startTime = new Date();
    let context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: params.correlationId,
      method: 'POST',
      description: 'create a forgotten password for a user',
    };

    let callbackToPromiseConverter = createCallbackToPromiseConverter(context);

    requestLogger.logRequestStart(context);

    baseClient.post(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;
  };

  let getForgottenPassword = params => {
    let url = `${forgottenPasswordResource}/${params.code}`;
    let defer = q.defer();
    let startTime = new Date();
    let context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: params.correlationId,
      method: 'GET',
      description: 'get a forgotten password',
    };

    let callbackToPromiseConverter = createCallbackToPromiseConverter(context);

    requestLogger.logRequestStart(context);

    baseClient.get(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;
  };

  return {
    getForgottenPassword: getForgottenPassword,
    createForgottenPassword: createForgottenPassword,
    incrementSessionVersionForUser: incrementSessionVersionForUser,
    resetLoginAttemptsForUser: resetLoginAttemptsForUser,
    incrementLoginAttemptsForUser: incrementLoginAttemptsForUser,
    getUser: getUser,
    createUser: createUser,
    authenticateUser: authenticateUser
  };
};
