'use strict';

const q = require('q');
const _ = require('lodash');
const requestLogger = require('../../utils/request_logger');
const baseClient = require('./base_client');
let User = require('../../models/user').User;
const createCallbackToPromiseConverter = require('../../utils/response_converter').createCallbackToPromiseConverter;

const SERVICE_NAME = 'adminusers';
const HEADER_USER_CONTEXT = 'GovUkPay-User-Context';

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
  let inviteResource = `${baseUrl}/v1/api/invites`;

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

    baseClient.get(url, {correlationId: correlationId}, callbackToPromiseConverter)
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

  /**
   * Get a valid invite or error if it's expired
   * @param inviteCode
   */
  let getValidatedInvite = (inviteCode) => {
    let params = {
      correlationId: correlationId
    };
    let url = `${inviteResource}/${inviteCode}`;
    let defer = q.defer();
    let startTime = new Date();
    let context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: correlationId,
      method: 'GET',
      description: 'find a validated invitation',
      service: SERVICE_NAME
    };

    let callbackToPromiseConverter = createCallbackToPromiseConverter(context);

    requestLogger.logRequestStart(context);

    baseClient.get(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;
  };

  /**
   * Submit user registration details
   * @param code
   * @param phoneNumber
   * @param password
   */
  let submitUserRegistration = (code, phoneNumber, password) => {
    let params = {
      correlationId: correlationId,
      payload: {
        telephone_number: phoneNumber,
        password: password,
        code: code
      }
    };
    let url = `${inviteResource}/otp/generate`;
    let defer = q.defer();
    let startTime = new Date();
    let context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: correlationId,
      method: 'POST',
      description: 'submit registration details',
      service: SERVICE_NAME
    };

    let callbackToPromiseConverter = createCallbackToPromiseConverter(context);

    requestLogger.logRequestStart(context);

    baseClient.post(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;
  };

  let verifyOtpAndCreateUser = (code, verificationCode) => {
    let params = {
      correlationId: correlationId,
      payload: {
        code: code,
        otp: verificationCode
      }
    };

    let url = `${inviteResource}/otp/validate`;
    let defer = q.defer();
    let startTime = new Date();
    let context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: correlationId,
      method: 'POST',
      description: 'submit otp code',
      service: SERVICE_NAME
    };

    let callbackToPromiseConverter = createCallbackToPromiseConverter(context, responseBodyToUserTransformer);

    requestLogger.logRequestStart(context);

    baseClient.post(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;
  };

  let verifyOtpForServiceInvite = (inviteCode, verificationCode) => {
    let params = {
      correlationId: correlationId,
      payload: {
        code: inviteCode,
        otp: verificationCode
      }
    };

    let url = `${inviteResource}/otp/validate/service`;
    let defer = q.defer();
    let startTime = new Date();
    let context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: correlationId,
      method: 'POST',
      description: 'submit service invite otp code',
      service: SERVICE_NAME
    };

    let callbackToPromiseConverter = createCallbackToPromiseConverter(context);

    requestLogger.logRequestStart(context);

    baseClient.post(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;
  };

  let resendOtpCode = (code, phoneNumber) => {
    let params = {
      correlationId: correlationId,
      payload: {
        code: code,
        telephone_number: phoneNumber
      }
    };

    let url = `${inviteResource}/otp/resend`;
    let defer = q.defer();
    let startTime = new Date();
    let context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: correlationId,
      method: 'POST',
      description: 'resend otp code',
      service: SERVICE_NAME
    };

    let callbackToPromiseConverter = createCallbackToPromiseConverter(context);

    requestLogger.logRequestStart(context);

    baseClient.post(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;
  };

  /**
   * Submit service registration details
   *
   * @param email
   * @param phoneNumber
   * @param password
   */
  const submitServiceRegistration = (email, phoneNumber, password) => {
    const params = {
      correlationId: correlationId,
      payload: {
        email: email,
        telephone_number: phoneNumber,
        password: password
      }
    };
    const url = `${inviteResource}/service`;
    const defer = q.defer();
    const startTime = new Date();
    const context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: correlationId,
      method: 'POST',
      description: 'submit service registration details',
      service: SERVICE_NAME
    };

    const callbackToPromiseConverter = createCallbackToPromiseConverter(context);

    requestLogger.logRequestStart(context);

    baseClient.post(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;
  };

  let deleteUser = (serviceId, removerId, userId) => {

    const params = {
      correlationId: correlationId,
      headers: {}
    };
    const url = `${serviceUserResource}/${serviceId}/users/${userId}`;
    const defer = q.defer();
    const startTime = new Date();
    const context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: correlationId,
      method: 'DELETE',
      description: 'delete a user from a service',
      userDelete: userId,
      userRemover: removerId,
      service: SERVICE_NAME
    };
    const callbackToPromiseConverter = createCallbackToPromiseConverter(context);
    requestLogger.logRequestStart(context);

    params.headers[HEADER_USER_CONTEXT] = removerId;
    baseClient.delete(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;
  };

 /**
   * Submit service registration details
   *
   */
  const createService = (gatewayAccountIds) => {
    const params = {
      correlationId: correlationId,
      payload: {
        gateway_account_ids: gatewayAccountIds
      }
    };
    const url = `${serviceUserResource}`;
    const defer = q.defer();
    const startTime = new Date();
    const context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: correlationId,
      method: 'POST',
      description: 'create service',
      service: SERVICE_NAME
    };

    const callbackToPromiseConverter = createCallbackToPromiseConverter(context);

    requestLogger.logRequestStart(context);

   console.log(params);
    baseClient.post(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;
  };

  return {
    getForgottenPassword: getForgottenPassword,
    createForgottenPassword: createForgottenPassword,
    incrementSessionVersionForUser: incrementSessionVersionForUser,
    getUserByExternalId: getUserByExternalId,
    authenticateUser: authenticateUser,
    updatePasswordForUser: updatePasswordForUser,
    sendSecondFactor: sendSecondFactor,
    authenticateSecondFactor: authenticateSecondFactor,
    getServiceUsers: getServiceUsers,
    updateServiceRole: updateServiceRole,
    inviteUser: inviteUser,
    getValidatedInvite: getValidatedInvite,
    submitUserRegistration: submitUserRegistration,
    verifyOtpAndCreateUser: verifyOtpAndCreateUser,
    resendOtpCode: resendOtpCode,
    submitServiceRegistration: submitServiceRegistration,
    deleteUser: deleteUser,
    verifyOtpForServiceInvite: verifyOtpForServiceInvite,
    createService: createService
  };
};
