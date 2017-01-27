const q = require('q');
const _ = require('lodash');
const requestLogger = require('../../utils/request_logger');
const baseClient = require('./base_client');
var User = require('../../models/user2').User;

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
const createCallbackToPromiseConverter = (context, transformer) => {
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

    if (body && transformer && typeof transformer === 'function') {
      defer.resolve(transformer(body));
    } else {
      defer.resolve(body);
    }
  };
};

/**
 * @private
 * @param body
 */
const responseBodyToUserTransformer = body => new User(body);

module.exports = function (clientOptions = {}) {

  var baseUrl = clientOptions.baseUrl || process.env.ADMINUSERS_URL;
  var correlationId = clientOptions.correlationId || '';
  var userResource = `${baseUrl}/v1/api/users`;
  var forgottenPasswordResource = `${baseUrl}/v1/api/forgotten-passwords`;

  /**
   * Create a new user
   *
   * @param {User} user
   * @returns {Promise}
   */
  let createUser = (user) => {
    let params = {
      payload: user.toMinimalJson(),
      correlationId: correlationId
    };
    let url = userResource;
    let defer = q.defer();
    let startTime = new Date();
    let context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: correlationId,
      method: 'POST',
      description: 'create a user',
    };

    let callbackToPromiseConverter = createCallbackToPromiseConverter(context, responseBodyToUserTransformer);

    requestLogger.logRequestStart(context);

    baseClient.post(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;
  };

  /**
   *
   * @param {string} username
   * @return {Promise<User>} A promise of a User
   */
  let getUser = username => {
    let params = {
      correlationId: correlationId
    };
    let url = `${userResource}/${username}`;
    let defer = q.defer();
    let startTime = new Date();
    let context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: correlationId,
      method: 'GET',
      description: 'find a user',
    };

    let callbackToPromiseConverter = createCallbackToPromiseConverter(context, responseBodyToUserTransformer);

    requestLogger.logRequestStart(context);

    baseClient.get(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;
  };

  let authenticateUser = (username, password) => {

    let params = {
      correlationId: correlationId,
      payload: {
        username: username,
        password: password
      }
    };

    let url = `${userResource}/authenticate`;
    let defer = q.defer();
    let startTime = new Date();
    let context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: correlationId,
      method: 'POST',
      description: 'authenticate a user',
    };

    let callbackToPromiseConverter = createCallbackToPromiseConverter(context, responseBodyToUserTransformer);

    requestLogger.logRequestStart(context);

    baseClient.post(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;

  };

  let incrementLoginAttemptsForUser = username => {
    let params = {
      correlationId: correlationId
    };
    let url = `${userResource}/${username}/attempt-login`;
    let defer = q.defer();
    let startTime = new Date();
    let context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: correlationId,
      method: 'POST',
      description: 'increment login attempts for a user',
    };

    let callbackToPromiseConverter = createCallbackToPromiseConverter(context);

    requestLogger.logRequestStart(context);

    baseClient.post(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;
  };

  let resetLoginAttemptsForUser = username => {
    let params = {
      correlationId: correlationId
    };
    let url = `${userResource}/${username}/attempt-login?action=reset`;
    let defer = q.defer();
    let startTime = new Date();
    let context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: correlationId,
      method: 'POST',
      description: 'reset login attempts for a user',
    };

    let callbackToPromiseConverter = createCallbackToPromiseConverter(context);

    requestLogger.logRequestStart(context);

    baseClient.post(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;
  };

  let incrementSessionVersionForUser = username => {
    let params = {
      correlationId: correlationId,
      payload: {
        op: 'replace',
        path: 'sessionVersion',
        value: 1
      }
    };

    let url = `${userResource}/${username}`;
    let defer = q.defer();
    let startTime = new Date();
    let context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: correlationId,
      method: 'PATCH',
      description: 'increment session version for a user',
    };

    let callbackToPromiseConverter = createCallbackToPromiseConverter(context);

    requestLogger.logRequestStart(context);

    baseClient.patch(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;
  };

  let createForgottenPassword = username => {
    let params = {
      correlationId: correlationId,
      payload: {
        username: username
      }
    };
    let url = `${forgottenPasswordResource}`;
    let defer = q.defer();
    let startTime = new Date();
    let context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: correlationId,
      method: 'POST',
      description: 'create a forgotten password for a user',
    };

    let callbackToPromiseConverter = createCallbackToPromiseConverter(context);

    requestLogger.logRequestStart(context);

    baseClient.post(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;
  };

  let getForgottenPassword = code => {
    let params = {
      correlationId: correlationId,
    };
    let url = `${forgottenPasswordResource}/${code}`;
    let defer = q.defer();
    let startTime = new Date();
    let context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: correlationId,
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
