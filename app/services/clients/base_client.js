const urlParse = require('url');
const https = require('https');

const logger = require('winston');

const customCertificate = require(__dirname + '/../../utils/custom_certificate');
const CORRELATION_HEADER_NAME = require(__dirname + '/../../utils/correlation_header').CORRELATION_HEADER;

var agentOptions = {
  keepAlive: true,
  maxSockets: process.env.MAX_SOCKETS || 100
};

/**
 * @type {https.Agent}
 */
const agent = new https.Agent(agentOptions);

if (process.env.DISABLE_INTERNAL_HTTPS !== "true") {
  customCertificate.addCertsToAgent(agent);
} else {
  logger.warn('DISABLE_INTERNAL_HTTPS is set.');
}

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
  const parsedUrl = urlParse.parse(url);
  let headers = {};

  headers["Content-Type"] = "application/json";
  headers[CORRELATION_HEADER_NAME] = args.correlationId || '';

  const httpsOptions = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port,
    path: parsedUrl.path,
    method: methodName,
    agent: agent,
    headers: headers
  };

  let req = https.request(httpsOptions, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        data = JSON.parse(data);
      } catch(e) {
        //if response exists but is not parsable, log it and carry on
        if (data) {
          logger.info('Response from %s in unexpected format: %s', url, data);
        }
        data = null;
      }
      callback(null, {statusCode: res.statusCode}, data);
    });
  });

  if (args.payload) {
    req.write(JSON.stringify(args.payload));
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
