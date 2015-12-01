var clientSessions = require("client-sessions");

var sessionConfig = {
    'cookieName': 'selfservice_state',
    'secret':     process.env.SESSION_ENCRYPTION_KEY
};

module.exports = {
    create : function (tokenValue) {
      return clientSessions.util.encode(sessionConfig, {"token": tokenValue, "description": "description"});
    },

    decrypt: function decryptCookie(res) {
      var setCookieHeader = res.headers['set-cookie'];
      if (!setCookieHeader) return {};
      else return clientSessions.util.decode(sessionConfig, setCookieHeader[0].split(";")[0].split("=")[1]).content;
    }

};
