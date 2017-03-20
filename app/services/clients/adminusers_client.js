const q = require('q');
const _ = require('lodash');
const requestLogger = require('../../utils/request_logger');
const baseClient = require('./base_client');
var User = require('../../models/user').User;
const createCallbackToPromiseConverter = require('../../utils/response_converter').createCallbackToPromiseConverter;


const SERVICE_NAME = 'adminusers';


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
  var resetPasswordResource = `${baseUrl}/v1/api/reset-password`;

  /**
   * Create a new user
   *
   * @param {User} user
   * @returns {Promise<User>}
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
      service: SERVICE_NAME
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
      service: SERVICE_NAME
    };

    let callbackToPromiseConverter = createCallbackToPromiseConverter(context, responseBodyToUserTransformer);

    requestLogger.logRequestStart(context);

    baseClient.get(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;
  };

  /**
   * @param username
   * @param password
   * @returns {Promise<User>}
   */
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
      service: SERVICE_NAME
    };

    let callbackToPromiseConverter = createCallbackToPromiseConverter(context, responseBodyToUserTransformer);

    requestLogger.logRequestStart(context);

    baseClient.post(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;

  };

  /**
   *
   * @param username
   * @returns {Promise}
   */
  let incrementSessionVersionForUser = username => {
    let params = {
      correlationId: correlationId,
      payload: {
        op: 'append',
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
      service: SERVICE_NAME
    };

    let callbackToPromiseConverter = createCallbackToPromiseConverter(context, responseBodyToUserTransformer);

    requestLogger.logRequestStart(context);

    baseClient.patch(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;
  };

  /**
   *
   * @param username
   * @returns {Promise<ForgottenPassword>}
   */
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
      service: SERVICE_NAME
    };

    let callbackToPromiseConverter = createCallbackToPromiseConverter(context);

    requestLogger.logRequestStart(context);

    baseClient.post(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;
  };

  /**
   *
   * @param username
   * @returns {Promise<ForgottenPassword>}
   */
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
      service: SERVICE_NAME
    };

    let callbackToPromiseConverter = createCallbackToPromiseConverter(context);

    requestLogger.logRequestStart(context);

    baseClient.get(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;
  };

  /**
   *
   * @param token
   * @param newPassword
   * @returns {Promise}
   */
  let updatePasswordForUser = (token, newPassword) => {
    let params = {
      correlationId: correlationId,
      payload: {
        forgotten_password_code: token,
        new_password: newPassword
      }
    };
    let url = resetPasswordResource;
    let defer = q.defer();
    let startTime = new Date();
    let context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: correlationId,
      method: 'POST',
      description: 'update a password for a user',
      service: SERVICE_NAME
    };

    let callbackToPromiseConverter = createCallbackToPromiseConverter(context);

    requestLogger.logRequestStart(context);

    baseClient.post(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;
  };

  /**
   *
   * @param username
   * @returns {Promise}
   */
  let sendSecondFactor = username => {
    let params = {
      correlationId: correlationId,
    };

    let url = `${userResource}/${username}/second-factor/`;
    let defer = q.defer();
    let startTime = new Date();
    let context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: correlationId,
      method: 'POST',
      description: 'post a second factor auth token to the user',
      service: SERVICE_NAME
    };

    let callbackToPromiseConverter = createCallbackToPromiseConverter(context);

    requestLogger.logRequestStart(context);

    baseClient.post(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;
  };

  /**
   *
   * @param username
   * @param code
   * @returns {Promise}
   */
  let authenticateSecondFactor = (username, code) => {
    let params = {
      correlationId: correlationId,
      payload: {
        code:code
      }
    };

    let url = `${userResource}/${username}/second-factor/authenticate`;
    let defer = q.defer();
    let startTime = new Date();
    let context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: correlationId,
      method: 'POST',
      description: 'authenticate a second factor auth token entered by user',
      service: SERVICE_NAME
    };

    let callbackToPromiseConverter = createCallbackToPromiseConverter(context, responseBodyToUserTransformer);

    requestLogger.logRequestStart(context);

    baseClient.post(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;
  };

  return {
    getForgottenPassword: getForgottenPassword,
    createForgottenPassword: createForgottenPassword,
    incrementSessionVersionForUser: incrementSessionVersionForUser,
    getUser: getUser,
    createUser: createUser,
    authenticateUser: authenticateUser,
    updatePasswordForUser: updatePasswordForUser,
    sendSecondFactor:sendSecondFactor,
    authenticateSecondFactor:authenticateSecondFactor
  };
};
