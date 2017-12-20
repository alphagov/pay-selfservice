'use strict'

const SESSION_ENCRYPTION_KEY = process.env.SESSION_ENCRYPTION_KEY
const COOKIE_MAX_AGE_SESSION = process.env.COOKIE_MAX_AGE
const COOKIE_MAX_AGE_GATEWAY_ACCOUNT = process.env.COOKIE_MAX_AGE_GATEWAY_ACCOUNT ? parseInt(process.env.COOKIE_MAX_AGE_GATEWAY_ACCOUNT) : 2592000000
const COOKIE_MAX_AGE_REGISTRATION = process.env.COOKIE_MAX_AGE_REGISTRATION ? parseInt(process.env.COOKIE_MAX_AGE_REGISTRATION) : 3600000

if (!SESSION_ENCRYPTION_KEY) {
  throw new Error('cookie encryption key is not set')
}

if (!COOKIE_MAX_AGE_SESSION) {
  throw new Error('cookie max age is not set')
}

exports.session = {
  cookieName: 'session', // cookie name dictates the key name added to the request object
  secret: SESSION_ENCRYPTION_KEY,
  duration: parseInt(COOKIE_MAX_AGE_SESSION), // how long the session will stay valid in ms
  proxy: true,
  cookie: {
    ephemeral: false, // when true, cookie expires when the browser closes
    httpOnly: true, // when true, cookie is not accessible from javascript
    secureProxy: true
  }
}

exports.gatewayAccount = {
  cookieName: 'gateway_account', // cookie name dictates the key name added to the request object
  secret: SESSION_ENCRYPTION_KEY,
  duration: COOKIE_MAX_AGE_GATEWAY_ACCOUNT, // how long the clientSessions will stay valid in ms
  proxy: true,
  cookie: {
    ephemeral: false, // when true, cookie expires when the browser closes
    httpOnly: true, // when true, cookie is not accessible from javascript
    secureProxy: true // when true, cookie will only be sent over SSL. use key 'secureProxy' instead if you handle SSL not in your node process
  }
}

exports.registration = {
  cookieName: 'register_invite', // cookie name dictates the key name added to the request object
  secret: SESSION_ENCRYPTION_KEY,
  duration: COOKIE_MAX_AGE_REGISTRATION, // how long the clientSessions will stay valid in ms
  proxy: true,
  cookie: {
    ephemeral: false, // when true, cookie expires when the browser closes
    httpOnly: true, // when true, cookie is not accessible from javascript
    secureProxy: true // when true, cookie will only be sent over SSL. use key 'secureProxy' instead if you handle SSL not in your node process
  }
}



