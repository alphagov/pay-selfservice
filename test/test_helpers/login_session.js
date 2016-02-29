var clientSessions = require("client-sessions");
var sessionCookie = require(__dirname + '/../../app/utils/cookies.js').sessionCookie;

module.exports = {
    create : function(value) {
      return clientSessions.util.encode(sessionCookie(), value);
    },

    decrypt: function decryptCookie(res) {
      var setCookieHeader = res.headers['set-cookie'];
      if (!setCookieHeader) return {};
      else return clientSessions.util.decode(sessionCookie(), setCookieHeader[0].split(";")[0].split("=")[1]).content;
    }

};
