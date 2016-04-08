'use strict';
var Sequelize = require('sequelize'),
  session = require('express-session'),
  uuid = require('uuid'),
  SequelizeStore = require('connect-session-sequelize')(session.Store);

var sqlize = new Sequelize(
  process.env.DATABASE_NAME,
  process.env.DATABASE_USER,
  process.env.DATABASE_PASSWORD, {
    "dialect": "postgres",
    "host":  process.env.DATABASE_HOST,
    "port": process.env.DATABASE_PORT
  });

var sqlizeStore = new SequelizeStore({
  db: sqlize
});

module.exports = function () {

  function selfServiceSession() {
    checkEnv();
    var sessionConfig = {
      genid: function (req) {
        return uuid.v4();
      },
      name: 'selfservice_state',
      proxy: true,
      saveUninitialized: true,
      resave: false,
      secret: process.env.SESSION_ENCRYPTION_KEY,
      cookie: {
        maxAge: parseInt(process.env.COOKIE_MAX_AGE),
        httpOnly: true,
        secure: (process.env.SECURE_COOKIE_OFF !== "true")
      }
    };
    if (process.env.SESSION_IN_MEMORY !== "true") {
      //sqlizeStore.sync();
      sessionConfig.store = sqlizeStore;
    }
    return sessionConfig;
  }

  var checkEnv = function () {
    if (process.env.SESSION_ENCRYPTION_KEY === undefined) throw new Error('cookie encryption key is not set');
    if (process.env.COOKIE_MAX_AGE === undefined) throw new Error('cookie max age is not set');
  };

  return {
    sessionCookie: selfServiceSession
  }

}();
