"use strict";
var auth  = require('../services/auth_service.js'),
errorView = require('../utils/response.js').renderErrorView,
Connector = require('../services/connector_client.js').ConnectorClient,
client    = new Connector(process.env.CONNECTOR_URL),
Email     = require('../models/email.js');



module.exports = function (req, res, next) {
  var accountId = auth.get_account_id(req);
  var init = function () {
    client.withGetAccount(accountId, function(data){
      req.account = data;
      Email.get(req.account.gateway_account_id).then(function(customEmailText){
        req.account.customEmailText = customEmailText;
        next();
      },connectorError);
    }).on('connectorError', connectorError);
  },
  connectorError = function(){
    errorView(req, res);
  };

  init();
};
