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

  return connectorClient.getAccount(params)
    .then(data => {
      req.account = data;

      var emailModel = Email(req.headers[CORRELATION_HEADER]);
      return emailModel.get(req.account.gateway_account_id)
    })
    .then(emailData => {
      req.account = _.merge(req.account, emailData);
      next();
    })
    .catch(() => errorView(req, res));
};
