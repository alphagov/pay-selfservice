const https    = require('https');
const httpAgent    = require('http').globalAgent;
const urlParse = require('url').parse;

var request = require('request');
const logger = require('winston');

const customCertificate       = require(__dirname + '/../../utils/custom_certificate');
const CORRELATION_HEADER_NAME = require(__dirname + '/../../utils/correlation_header').CORRELATION_HEADER;

var agentOptions = {
  keepAlive: true,
  maxSockets: process.env.MAX_SOCKETS || 100
};

/**
 * @type {https.Agent}
 */
const httpsAgent = new https.Agent(agentOptions);

if (process.env.DISABLE_INTERNAL_HTTPS !== "true") {
  customCertificate.addCertsToAgent(httpsAgent);
} else {
  logger.warn('DISABLE_INTERNAL_HTTPS is set.');
}

var client = request
  .defaults({json: true});

const getHeaders = function getHeaders(args) {
  let headers = {};

  headers["Content-Type"] = "application/json";
  headers[CORRELATION_HEADER_NAME] = args.correlationId || '';
  
  return headers;
};
/**
 *
 * @param {string} methodName
 * @param {string} url
 * @param {Object} args
 * @param {Function} callback
 *
 * @returns {OutgoingMessage}
 *
 * @private
 */
var _request = function request(methodName, url, args, callback) {
  let agent = urlParse(url).protocol === 'http:' ? httpAgent : httpsAgent;

  const requestOptions = {
    uri: url,
    method: methodName,
    agent: agent,
    headers: getHeaders(args)
  };

  if (args.payload) {
    requestOptions.body = args.payload;
  }

  return client(requestOptions, callback);
};


/*
 * @module baseClient
 */
module.exports = {
  /**
   *
   * @param {string} url
   * @param {Object} args
   * @param {function} callback
   *
   * @returns {OutgoingMessage}
   */
  get: function(url, args, callback) {
    return _request('GET', url, args, callback);
  },

  /**
   *
   * @param {string} url
   * @param {Object} args
   * @param {function} callback
   *
   * @returns {OutgoingMessage}
   */
  post : function (url, args, callback) {
    return _request('POST', url, args, callback);
  },

  /**
   *
   * @param {string} url
   * @param {Object} args
   * @param {function} callback
   *
   * @returns {OutgoingMessage}
   */
  put: function(url, args, callback) {
    return _request('PUT', url, args, callback);
  },

  /**
   *
   * @param {string} url
   * @param {Object} args
   * @param {function} callback
   *
   * @returns {OutgoingMessage}
   */
  patch: function(url, args, callback) {
    return _request('PATCH', url, args, callback);
  },

  /**
   *
   * @param {string} url
   * @param {Object} args
   * @param {function} callback
   *
   * @returns {OutgoingMessage}
   */
  delete: function(url, args, callback) {
    return _request('DELETE', url, args, callback);
  }
};
