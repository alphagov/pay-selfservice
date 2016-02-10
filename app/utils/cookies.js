'use strict';

module.exports = function () {
  function cookieOpts() {
    var cookieOpts = {httpOnly: true};
    if (process.env.SECURED_ENV == "true") {
      cookieOpts.secure = true;
    }
    return cookieOpts;
  }

  function namedCookie(name) {
    return {
      cookieName: name,
      proxy: true,
      secret: process.env.SESSION_ENCRYPTION_KEY,
      cookie: cookieOpts()
    };
  }

  var selfServiceCookie = function () {
    return namedCookie('selfservice_state');
  };

  var sessionCookie = function () {
    return namedCookie('session');
  };

  return {
    selfServiceCookie: selfServiceCookie,
    sessionCookie: sessionCookie
  }

}();
