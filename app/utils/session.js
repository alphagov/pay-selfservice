'use strict';

const session = require('client-sessions'),
  _ = require('lodash'),
  logger = require('winston');
  if (process.env.SECURE_COOKIE_OFF == 'true') {
    logger.error('SECURE COOKIE IS OFF');
  }

function checkEnv() {
  if (process.env.SESSION_ENCRYPTION_KEY === undefined) throw new Error('cookie encryption key is not set');
  if (process.env.COOKIE_MAX_AGE === undefined) throw new Error('cookie max age is not set');
}

module.exports.selfServiceSession = function selfServiceSession() {
  checkEnv();
  return session({
    cookieName: 'session', // cookie name dictates the key name added to the request object
    secret: process.env.SESSION_ENCRYPTION_KEY,
    duration: parseInt(process.env.COOKIE_MAX_AGE), // how long the session will stay valid in ms
    proxy: true,
    cookie: {
      ephemeral: false, // when true, cookie expires when the browser closes
      httpOnly: true, // when true, cookie is not accessible from javascript
      secure: (process.env.SECURE_COOKIE_OFF !== "true")
    }
  });
};

