const q          = require('q');

const requestLogger = require('../../utils/request_logger');
const createCallbackToPromiseConverter = require('../../utils/response_converter').createCallbackToPromiseConverter;
const baseClient = require('./base_client');

const SERVICE_NAME = 'publicauth';

/**
 * @param {string} accountId
 */
const getUrlForAccountId = accountId => `${process.env.PUBLIC_AUTH_URL}/${accountId}`;


module.exports = {
  /**
   * Get active tokens for account
   *
   * Expects {
   *  accountId: accountId,
   *  correlationId: correlationId
   * }
   *
   * @param {Object} params
   * @returns {Promise}
   */
  getActiveTokensForAccount: (params) => {
    let url = getUrlForAccountId(params.accountId);
    let defer = q.defer();
    let startTime = new Date();
    let context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: params.correlationId,
      method: 'GET',
      description: 'get active tokens',
      service: SERVICE_NAME
    };
    let callbackToPromiseConverter =  createCallbackToPromiseConverter(context);

    requestLogger.logRequestStart(context);

    baseClient.get(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;
  },

  /**
   * Get revoked tokens for account
   *
   * Expects {
   *  accountId: accountId,
   *  correlationId: correlationId
   * }
   *
   * @param {Object} params
   * @returns {Promise}
   */
  getRevokedTokensForAccount: (params) => {
    let url = `${getUrlForAccountId(params.accountId)}?state=revoked`;
    let defer = q.defer();
    let startTime = new Date();
    let context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: params.correlationId,
      method: 'GET',
      description: 'get revoked tokens',
      service: SERVICE_NAME
    };
    let callbackToPromiseConverter =  createCallbackToPromiseConverter(context);

    requestLogger.logRequestStart(context);

    baseClient.get(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;
  },

  /**
   * Get active tokens for account
   *
   * Expects {
   *  accountId: accountId,
   *  correlationId: correlationId,
   *  payload: {
   *    account_id: accountId,
   *    created_by: (email of creator)
   *    description: description,
   *  }
   * }
   *
   * @param {Object} params
   * @returns {Promise}
   */
  createTokenForAccount: (params) => {
    let url = process.env.PUBLIC_AUTH_URL;
    let defer = q.defer();
    let startTime = new Date();
    let context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: params.correlationId,
      method: 'POST',
      description: 'create new token',
      service: SERVICE_NAME
    };
    let callbackToPromiseConverter =  createCallbackToPromiseConverter(context);

    requestLogger.logRequestStart(context);

    baseClient.post(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;
  },

  /**
   * Update a token
   *
   * Expects {
   *  accountId: accountId,
   *  correlationId: correlationId,
   *  payload: {
   *    token_link: token_link,
   *    description: description
   *  }
   * }
   *
   * @param {Object} params
   * @returns {Promise}
   */
  updateToken: (params) => {
    let url = process.env.PUBLIC_AUTH_URL;
    let defer = q.defer();
    let startTime = new Date();
    let context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: params.correlationId,
      method: 'PUT',
      description: 'update token',
      service: SERVICE_NAME
    };
    let callbackToPromiseConverter =  createCallbackToPromiseConverter(context);

    requestLogger.logRequestStart(context);

    baseClient.put(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;
  },

  /**
   * Delete a token
   *
   * Expects {
   *  accountId: accountId,
   *  correlationId: correlationId,
   *  payload: {
   *    token_link: token_link,
   *  }
   * }
   *
   * @param {Object} params
   * @returns {Promise}
   */
  deleteTokenForAccount: (params) => {
    let url = getUrlForAccountId(params.accountId);
    let defer = q.defer();
    let startTime = new Date();
    let context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: params.correlationId,
      method: 'DELETE',
      description: 'delete token',
      service: SERVICE_NAME
    };
    let callbackToPromiseConverter =  createCallbackToPromiseConverter(context);

    requestLogger.logRequestStart(context);

    baseClient.delete(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;
  }
};
