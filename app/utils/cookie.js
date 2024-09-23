'use strict'

const session = require('client-sessions')

const _1_HOUR = 60 * 60 * 1000
const DISABLE_INTERNAL_HTTPS = process.env.DISABLE_INTERNAL_HTTPS === 'true'
const COOKIE_MAX_AGE_REGISTRATION = process.env.COOKIE_MAX_AGE_REGISTRATION
  ? parseInt(process.env.COOKIE_MAX_AGE_REGISTRATION) : _1_HOUR

function checkEnv () {
  if (process.env.SESSION_ENCRYPTION_KEY === undefined) {
    throw new Error('cookie encryption key is not set')
  }
  if (process.env.COOKIE_MAX_AGE === undefined) {
    throw new Error('cookie max age is not set')
  }
}

function sessionCookie () {
  checkEnv()
  return session({
    cookieName: 'session', // cookie name dictates the key name added to the request object
    secret: process.env.SESSION_ENCRYPTION_KEY,
    duration: parseInt(process.env.COOKIE_MAX_AGE), // how long the session will stay valid in ms
    proxy: true,
    cookie: {
      ephemeral: false, // when true, cookie expires when the browser closes
      httpOnly: true, // when true, cookie is not accessible from javascript
      secureProxy: !DISABLE_INTERNAL_HTTPS,
      sameSite: "Lax"
    }
  })
}

function registrationCookie () {
  checkEnv()
  return session({
    cookieName: 'register_invite', // cookie name dictates the key name added to the request object
    secret: process.env.SESSION_ENCRYPTION_KEY,
    duration: COOKIE_MAX_AGE_REGISTRATION, // how long the clientSessions will stay valid in ms
    proxy: true,
    cookie: {
      ephemeral: false, // when true, cookie expires when the browser closes
      httpOnly: true, // when true, cookie is not accessible from javascript
      secureProxy: !DISABLE_INTERNAL_HTTPS, // when true, cookie will only be sent over SSL. use key 'secureProxy' instead if you handle SSL not in your node process
      SameSite: 'Lax'
    }
  })
}

module.exports = {
  sessionCookie,
  registrationCookie
}
