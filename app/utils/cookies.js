'use strict';

module.exports = function () {
  function cookieOpts() {
    if (process.env.SECURED == "true") {
      return {
        httpOnly: true,
        secure: true
      };
    } else {
      return {};
    }
  }

  function namedCookie(name) {
    return {
      cookieName: name,
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
