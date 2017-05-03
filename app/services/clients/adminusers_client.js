const q = require('q');
const _ = require('lodash');
const requestLogger = require('../../utils/request_logger');
const baseClient = require('./base_client');
let User = require('../../models/user').User;
const createCallbackToPromiseConverter = require('../../utils/response_converter').createCallbackToPromiseConverter;

const SERVICE_NAME = 'adminusers';

/**
 * @private
 * @param body
 */
const responseBodyToUserTransformer = body => new User(body);

module.exports = function (clientOptions = {}) {

  let baseUrl = clientOptions.baseUrl || process.env.ADMINUSERS_URL;
  let correlationId = clientOptions.correlationId || '';
  let userResource = `${baseUrl}/v1/api/users`;
  let forgottenPasswordResource = `${baseUrl}/v1/api/forgotten-passwords`;
  let resetPasswordResource = `${baseUrl}/v1/api/reset-password`;
  let serviceUserResource = `${baseUrl}/v1/api/services`;

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
   * Get a User by external id
   *
   * @param {string} externalId
   * @return {Promise<User>} A promise of a User
   */
  let getUserByExternalId = (externalId) => {
    let params = {
      correlationId: correlationId
    };
    let url = `${userResource}/${externalId}`;
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
   * Get a User by username
   *
   * @param {string} username
   * @return {Promise<User>} A promise of a User
   */
  let getUserByUsername = (username) => {
    let params = {
      correlationId: correlationId
    };
    let url = `${userResource}?username=${username}`;
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
   * @param externalId
   * @returns {Promise}
   */
  let incrementSessionVersionForUser = (externalId) => {
    let params = {
      correlationId: correlationId,
      payload: {
        op: 'append',
        path: 'sessionVersion',
        value: 1
      }
    };

    let url = `${userResource}/${externalId}`;
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
  let createForgottenPassword = (username) => {
    let params = {
      correlationId: correlationId,
      payload: {
        username: username
      }
    };
    let url = forgottenPasswordResource;
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
   * @param code
   * @returns {Promise<ForgottenPassword>}
   */
  let getForgottenPassword = (code) => {
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
   * @param externalId
   * @returns {Promise}
   */
  let sendSecondFactor = (externalId) => {
    let params = {
      correlationId: correlationId,
    };

    let url = `${userResource}/${externalId}/second-factor/`;
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
   * @param externalId
   * @param code
   * @returns {Promise}
   */
  let authenticateSecondFactor = (externalId, code) => {
    let params = {
      correlationId: correlationId,
      payload: {
        code: code
      }
    };

    let url = `${userResource}/${externalId}/second-factor/authenticate`;
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

  let getServiceUsers = (serviceId) => {
    let url = `${serviceUserResource}/${serviceId}/users`;
     let defer = q.defer();
     let startTime = new Date();
     let context = {
        url: url,
        defer: defer,
        startTime: startTime,
        correlationId: correlationId,
        method: 'GET',
        description: 'get a services users',
        service: SERVICE_NAME
     };

     let callbackToPromiseConverter = createCallbackToPromiseConverter(context);
     requestLogger.logRequestStart(context);

     baseClient.get(url, { correlationId: correlationId }, callbackToPromiseConverter)
       .on('error', callbackToPromiseConverter);

     return defer.promise;
  };

  /**
   *
   * @param externalId
   * @param serviceId
   * @param roleName
   * @returns {Promise<User>}
   */
  let updateServiceRole = (externalId, serviceId, roleName) => {
    let params = {
      correlationId: correlationId,
      payload: {
        role_name: roleName
      }
    };

    let url = `${userResource}/${externalId}/services/${serviceId}`;
    let defer = q.defer();
    let startTime = new Date();
    let context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: correlationId,
      method: 'PUT',
      description: 'authenticate a second factor auth token entered by user',
      service: SERVICE_NAME
    };

    let callbackToPromiseConverter = createCallbackToPromiseConverter(context, responseBodyToUserTransformer);

    requestLogger.logRequestStart(context);

    baseClient.put(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;
  };

  /**
   *
   * @param invitee
   * @param senderId
   * @param serviceId
   * @param roleName
   * @returns {Promise}
   */
  let inviteUser = (invitee, senderId, serviceId, roleName) => {
    let params = {
      correlationId: correlationId,
      payload: {
        email: invitee,
        sender: senderId,
        role_name: roleName
      }
    };

    let url = `${serviceUserResource}/${serviceId}/invites`;
    let defer = q.defer();
    let startTime = new Date();
    let context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: correlationId,
      method: 'POST',
      description: 'invite a user to signup',
      service: SERVICE_NAME
    };

    let callbackToPromiseConverter = createCallbackToPromiseConverter(context);
    requestLogger.logRequestStart(context);

    baseClient.post(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;
  };

  return {
    getForgottenPassword: getForgottenPassword,
    createForgottenPassword: createForgottenPassword,
    incrementSessionVersionForUser: incrementSessionVersionForUser,
    getUserByExternalId: getUserByExternalId,
    getUserByUsername: getUserByUsername,
    createUser: createUser,
    authenticateUser: authenticateUser,
    updatePasswordForUser: updatePasswordForUser,
    sendSecondFactor:sendSecondFactor,
    authenticateSecondFactor:authenticateSecondFactor,
    getServiceUsers: getServiceUsers,
    updateServiceRole: updateServiceRole,
    inviteUser: inviteUser
  };
};
