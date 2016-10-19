"use strict";
var auth                = require('../services/auth_service.js'),
errorView               = require('../utils/response.js').renderErrorView,
Connector               = require('../services/connector_client.js').ConnectorClient,
client                  = new Connector(process.env.CONNECTOR_URL),
Email                   = require('../models/email.js'),
_                       = require('lodash');
var CORRELATION_HEADER  = require('../utils/correlation_header.js').CORRELATION_HEADER;
// SEEMS FINE

module.exports = function (req, res, next) {
  var accountId = auth.get_gateway_account_id(req);
  var params = {
    gatewayAccountId: accountId
  };
  var init = function () {
    client.withGetAccount(params, function(data){
      req.account = data;

      var emailModel = Email(req.headers[CORRELATION_HEADER]);
      emailModel.get(req.account.gateway_account_id).then(function(data){
        req.account = _.merge(req.account, data);
        next();
      },connectorError);
    }).on('connectorError', connectorError);
  },
  connectorError = function(){
    // AGAIN MAYBE REPLACE WITH FRONTEND VIEWS
    errorView(req, res);
  };

  init();
};
