"use strict";
var auth                = require('../services/auth_service.js'),
errorView               = require('../utils/response.js').renderErrorView,
Connector               = require('../services/clients/connector_client.js').ConnectorClient,
connectorClient                  = new Connector(process.env.CONNECTOR_URL),
Email                   = require('../models/email.js'),
_                       = require('lodash');
var CORRELATION_HEADER  = require('../utils/correlation_header.js').CORRELATION_HEADER;


module.exports = function (req, res, next) {
  var accountId = auth.getCurrentGatewayAccountId(req);
  var params = {
    gatewayAccountId: accountId
  };
  var init = function () {
      connectorClient.getAccount(params, function(data){
      req.account = data;

      var emailModel = Email(req.headers[CORRELATION_HEADER]);
      emailModel.get(req.account.gateway_account_id).then(function(data){
        req.account = _.merge(req.account, data);
        next();
      },connectorError);
    }).on('connectorError', connectorError);
  },
  connectorError = function(){
    errorView(req, res);
  };

  init();
};
