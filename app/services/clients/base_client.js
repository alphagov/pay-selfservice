const urlParse = require('url');
const https    = require('https');
const http    = require('http');
var  _ = require('lodash');

const logger = require('winston');

const customCertificate       = require(__dirname + '/../../utils/custom_certificate');
const CORRELATION_HEADER_NAME = require(__dirname + '/../../utils/correlation_header').CORRELATION_HEADER;

const agentOptions = {
  keepAlive: true,
  maxSockets: process.env.MAX_SOCKETS || 100
};

const HTTP_PROTOCOL = 'http:';

/**
 * @type {https.Agent}
 */
const httpsAgent = new https.Agent(agentOptions);
/**
 * @type {http.Agent}
 */
const httpAgent = new http.Agent(agentOptions);

if (process.env.DISABLE_INTERNAL_HTTPS !== "true") {
  customCertificate.addCertsToAgent(httpsAgent);
} else {
  logger.warn('DISABLE_INTERNAL_HTTPS is set.');
}

const getHeaders = function getHeaders(args) {
  let headers = {};

  headers["Content-Type"] = "application/json";
  headers["Accept"] = "application/json";
  headers[CORRELATION_HEADER_NAME] = args.correlationId || '';

  if (args.payload) {
    try {
      headers["Content-Length"] = Buffer.byteLength(JSON.stringify(args.payload));
    } catch (e) {
      logger.warn(`[${args.correlationId}] Setting content length header failed: ${e}`);
    }
  }

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

  let parsedUrl = urlParse.parse(url);
  let requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.path,
      method: methodName,
      agent: parsedUrl.protocol === HTTP_PROTOCOL ?
        httpAgent:
        httpsAgent,
      headers: getHeaders(args)
    };
  let httpLib = parsedUrl.protocol === HTTP_PROTOCOL ?
      http :
      https;

  var req = httpLib.request(requestOptions, res => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      if (data) {
        try {
          data = JSON.parse(data);
        } catch (e) {
          //if response exists but is not parsable, log it and carry on
          if (data) {
            logger.info('Response from %s in unexpected format: %s', url, data);
          }
          data = null;
        }
      }
      callback(null, res, data);
    });
  });

  if (args.payload) {
    req.write(JSON.stringify(args.payload), 'utf8');
  }

  req.on('response', (response) => {
    response.on('readable', () => {
      response.read();
    });
  });

  req.on('error', callback);

  req.end();

  return req;
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

