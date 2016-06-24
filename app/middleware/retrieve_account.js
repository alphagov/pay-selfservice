"use strict";
var csrf  = require('csrf'),
logger    = require('winston'),
errorView = require('../utils/response.js').renderErrorView,
Connector = require('../services/connector_client.js').ConnectorClient,
client    = new Connector(process.env.CONNECTOR_URL),
auth      = require('../services/auth_service.js'),
Email     = require('../models/email.js');



module.exports = function (req, res, next) {
  var accountId = auth.get_account_id(req);

  var init = function () {
    client.withGetAccount(accountId, function(data){
      req.account = data;
      // not too sure if this is actually a seperate call
      Email.get(req).then(function(customEmailText){
        req.account.customEmailText = customEmailText;
        next();
      },connectorError);
    }).on('connectorError', connectorError);
  },
  connectorError = function(){
    console.error('PROBLEM RETRIEVING ACCOUNT');
    errorView(req, res);
  };

  init();
};
