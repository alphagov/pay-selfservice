var clientSessions = require("client-sessions");

var sessionConfig = {
    'cookieName': 'session',
    'secret':     process.env.SESSION_ENCRYPTION_KEY
};

module.exports = {
    create : function(value) {
      return clientSessions.util.encode(sessionConfig, value);
    },

    decrypt: function decryptCookie(res) {
      var setCookieHeader = res.headers['set-cookie'];
      if (!setCookieHeader) return {};
      else return clientSessions.util.decode(sessionConfig, setCookieHeader[0].split(";")[0].split("=")[1]).content;
    }

};
