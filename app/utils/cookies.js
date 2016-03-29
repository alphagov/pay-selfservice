'use strict';

module.exports = function () {

  function sessionCookie() {
    checkEnv();
    return {
      proxy: true,
      saveUninitialized: false,
      resave: false,
      secret: process.env.SESSION_ENCRYPTION_KEY,
      key: 'express.sessionID',
      rolling: true,
      cookie: {
        maxAge: parseInt(process.env.COOKIE_MAX_AGE), // it will expire after 3 hours
        httpOnly: true,
        secure: (process.env.SECURE_COOKIE_OFF !== "true") // default is true, only false if the env variable present
      }
    };
  }

  var checkEnv = function () {
    if (process.env.SESSION_ENCRYPTION_KEY === undefined) throw new Error('cookie encryption key is not set');
    if (process.env.COOKIE_MAX_AGE === undefined) throw new Error('cookie max age is not set');
  };

  return {
    sessionCookie: sessionCookie
  }

}();
