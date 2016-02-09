var clientSessions = require("client-sessions");
var selfServiceCookie = require(__dirname + '/../../app/utils/cookies.js').selfServiceCookie;

module.exports = {
    create : function (tokenValue) {
      return clientSessions.util.encode(selfServiceCookie(), {"token": tokenValue, "description": "description"});
    },

    decrypt: function decryptCookie(res) {
      var setCookieHeader = res.headers['set-cookie'];
      if (!setCookieHeader) return {};
      else return clientSessions.util.decode(selfServiceCookie(), setCookieHeader[0].split(";")[0].split("=")[1]).content;
    }

};
