'use strict';

var tunnel = require('tunnel');
var urlParse = require('url').parse;
var _   = require('lodash');

// import libraries + save request pre-patching
var https = require('https');
var originalHttpsRequest = https.request;

// --- capture and rename env values ---
// only this module should get them otherwise other libraries such as
// requests will pick them up do a bad job around certificate handling.

if (process.env.HTTPS_PROXY) {
  console.log('Tunnelling HTTPS -> ', process.env.HTTPS_PROXY);
  process.env.TUNNEL_HTTPS_PROXY = process.env.HTTPS_PROXY;
  delete process.env.HTTPS_PROXY;
}

if (process.env.HTTP_PROXY) {
  console.log('Tunnelling HTTP -> ', process.env.HTTP_PROXY);
  process.env.TUNNEL_HTTP_PROXY = process.env.HTTP_PROXY;
  delete process.env.HTTP_PROXY;
}

if (process.env.NO_PROXY) {
  console.log('No proxy zones: ', process.env.NO_PROXY);
  process.env.TUNNEL_NO_PROXY = process.env.NO_PROXY;
  delete process.env.NO_PROXY;
}

/**
 * Basically, anything except requests to hosts on NO_PROXY list should be proxied
 * @param  {object} options Options passed to https.request
 * @return {boolean}
 */
function shouldProxy(options) {
  var noProxyList = (process.env.TUNNEL_NO_PROXY || '')
    .split(',')
    .map(e => '.' + e.toLowerCase()),
    host, port, found, parsedOptions = options;

  if (typeof options === 'string') {
    parsedOptions = urlParse(options);
  }

  if (!parsedOptions.port) {
    // port not always set on options
    parsedOptions.port = parsedOptions.uri ? parsedOptions.uri.port : 443; 
  }
  host = '.' + (parsedOptions.uri ? parsedOptions.uri.hostname : parsedOptions.host).toLowerCase();
  port = parsedOptions.uri ? parsedOptions.uri.port : parsedOptions.port;
  
  found = _.find(
    noProxyList,
    e => ('.' + host).endsWith(e) || ('.' + host + ':' + port).endsWith(e)
  );
  
  return !found;
}

// set up proxy interception
module.exports.use = function () {
  var httpsProxy = process.env.TUNNEL_HTTPS_PROXY;
  // only dealing with HTTPS calls for now.
  if (httpsProxy) {
    httpsProxy = urlParse(httpsProxy);

    https.request = function(options, callback) {
      if (shouldProxy(options)) {
        options.agent = tunnel.httpsOverHttp({
          proxy: { host: httpsProxy.hostname, port: httpsProxy.port },
          ca: https.globalAgent.options.ca
        });
      }

      return originalHttpsRequest.call(this, options, callback);
    };
  }
};
