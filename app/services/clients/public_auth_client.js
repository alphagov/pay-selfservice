const logger     = require('winston');
const q          = require('q');

const baseClient = require('./base_client');

/**
 * @param {string} accountId
 */
const getUrlForAccountId = accountId => `${process.env.PUBLIC_AUTH_URL}/${accountId}`;

/**
 * Creates a callback that can be used to log the stuff we're interested
 * in and converts the response/error into a promise.
 *
 * @private
 * @param {Object} context
 * @returns {function}
 */
const createCallbackToPromiseConverter = context => {
  let duration = new Date() - context.startTime;
  let defer = context.defer;

  return (error, response, body) => {
    logger.info(`[${context.correlationId}] - GET to ${context.url} ended - elapsed time: ${duration} ms`);

    if (response && response.statusCode !== 200) {
      logger.error(`[${context.correlationId}] Calling publicAuth to ${context.description} failed -`, {
        service: 'publicAuth',
        method: context.method,
        url: context.url,
        status: response.statusCode
      });
      defer.reject({response: response});
    }

    if (error) {
      logger.error(`[${context.correlationId}] Calling publicAuth to ${context.description} threw exception -`, {
        service: 'publicAuth',
        method: context.method,
        url: context.url,
        error: error
      });
      defer.reject({error: error});
    }

    defer.resolve(body);
  };
};

/**
 * @private
 * @param {Object} context
 */
const logRequestStart = context => {
  logger.debug(`Calling publicAuth  ${context.description}-`, {
    service: 'publicAuth',
    method: context.method,
    url: context.url
  });
};

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
      description: 'get active tokens'
    };
    let callbackToPromiseConverter =  createCallbackToPromiseConverter(context);

    logRequestStart(context);

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
      description: 'get revoked tokens'
    };
    let callbackToPromiseConverter =  createCallbackToPromiseConverter(context);

    logRequestStart(context);

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
      description: 'create new token'
    };
    let callbackToPromiseConverter =  createCallbackToPromiseConverter(context);

    logRequestStart(context);
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
      description: 'update token'
    };
    let callbackToPromiseConverter =  createCallbackToPromiseConverter(context);

    logRequestStart(context);

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
      description: 'delete token'
    };
    let callbackToPromiseConverter =  createCallbackToPromiseConverter(context);

    logRequestStart(context);

    baseClient.delete(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter);

    return defer.promise;
  }
};
