'use strict';

var sequelizeConfig = require(__dirname + '/sequelize_config.js').sequelize;

const session = require('express-session'),
  _ = require('lodash'),
  SequelizeStore = require('connect-session-sequelize')(session.Store),
  logger = require('winston');

module.exports = function () {

  function checkEnv() {
    
    if (process.env.SESSION_ENCRYPTION_KEY === undefined) throw new Error('cookie encryption key is not set');
    if (process.env.COOKIE_MAX_AGE === undefined) throw new Error('cookie max age is not set');
    
    logger.info('Checking environment variables', {
      'SECURE_COOKIE_OFF':process.env.SECURE_COOKIE_OFF,
      'SESSION_IN_MEMORY':process.env.SESSION_IN_MEMORY,
      'COOKIE_MAX_AGE':process.env.COOKIE_MAX_AGE,
      'SESSION_ENCRYPTION_KEY': '*****'
    });
  }

  function selfServiceSession() {

    var setSessionStore = function (sequelizeConfig) {
      if (process.env.SESSION_IN_MEMORY !== "true") {
        var store = new SequelizeStore({
          db: sequelizeConfig,
          checkExpirationInterval: 2 * 60 * 1000, //cleaning up expired sessions every 2 minute in db
          expiration: process.env.COOKIE_MAX_AGE
        });
        store.sync();
        return ({store: store});
      }
      return {};
    };

    checkEnv();
    var sessionConfig = {
      name: 'selfservice_state',
      proxy: true,
      saveUninitialized: false,
      resave: false,
      secret: process.env.SESSION_ENCRYPTION_KEY,
      cookie: {
        maxAge: parseInt(process.env.COOKIE_MAX_AGE),
        httpOnly: true,
        secure: (process.env.SECURE_COOKIE_OFF !== "true")
      }
    };

    _.extend(sessionConfig, setSessionStore(sequelizeConfig));
    return sessionConfig;
  }

  return {
    selfServiceSession: selfServiceSession
  }

}();
