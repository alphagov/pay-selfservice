'use strict';
const session = require('express-session'),
  Sequelize = require('sequelize'),
  SequelizeStore = require('connect-session-sequelize')(session.Store);

const sqlize = new Sequelize(
  process.env.DATABASE_NAME,
  process.env.DATABASE_USER,
  process.env.DATABASE_PASSWORD, {
    "dialect": "postgres",
    "host": process.env.DATABASE_HOST,
    "port": process.env.DATABASE_PORT,
    "logging": false
  });

module.exports = function () {

  var store;

  function getStore() {
    if (store) {
      return store;
    }
    store = new SequelizeStore({
      db: sqlize,
      checkExpirationInterval: 2 * 60 * 1000, //cleaning up expired sessions every 2 minute in db
      expiration: process.env.COOKIE_MAX_AGE
    });
    store.sync();
    return store;
  }

  function selfServiceSession() {
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
    if (process.env.SESSION_IN_MEMORY !== "true") {
      sessionConfig.store = getStore();
    }
    return sessionConfig;
  }

  var checkEnv = function () {
    if (process.env.SESSION_ENCRYPTION_KEY === undefined) throw new Error('cookie encryption key is not set');
    if (process.env.COOKIE_MAX_AGE === undefined) throw new Error('cookie max age is not set');
  };

  return {
    selfServiceSession: selfServiceSession
  }

}();
