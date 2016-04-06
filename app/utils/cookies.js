'use strict';
var session = require('express-session')
  , pg = require('pg')
  , pgSession = require('connect-pg-simple')(session);

var pgStore = new pgSession({
  pg: pg,
  tableName: 'user_sessions'
});

module.exports = function () {

  function sessionCookie() {
    checkEnv();
    var sessionConfig = {
      proxy: true,
      saveUninitialized: false,
      resave: false,
      secret: process.env.SESSION_ENCRYPTION_KEY,
      cookie: {
        maxAge: parseInt(process.env.COOKIE_MAX_AGE),
        httpOnly: true,
        secure: (process.env.SECURE_COOKIE_OFF !== "true") // default is true, only false if the env variable present
      }
    };
    if (process.env.SESSION_IN_MEMORY !== "true") {
      sessionConfig.store = pgStore;
    }
    return sessionConfig;

  }

  var checkEnv = function () {
    if (process.env.SESSION_ENCRYPTION_KEY === undefined) throw new Error('cookie encryption key is not set');
    if (process.env.COOKIE_MAX_AGE === undefined) throw new Error('cookie max age is not set');
  };

  return {
    sessionCookie: sessionCookie
  }

}();
