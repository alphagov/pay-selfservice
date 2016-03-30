'use strict';
var express = require('express');

module.exports = function () {

  var mockSession = function (app, sessionData) {
    var proxyApp = express();
    proxyApp.all("*", function (req, res, next) {
      req.session = sessionData;
      next();
    });
    proxyApp.use(app);
    return proxyApp;
  };

  var mockValidAccount = function (app, accountId) {
    var validSession = {passport: {user: {_json: {app_metadata: {account_id: accountId}}}}};
    return mockSession(app, validSession);
  };

  return {
    mockSession: mockSession,
    mockValidAccount: mockValidAccount
  }
}();
