var logger          = require('winston');
var csrf            = require('csrf');
var response        = require('../utils/response.js').response;
var Email           = require('../models/email.js');
var ConnectorClient = require('../services/connector_client.js').ConnectorClient;
var client =        new ConnectorClient(process.env.CONNECTOR_URL);
var auth            = require('../services/auth_service.js');

module.exports.index = function (req, res) {
  var accountId = auth.get_account_id(req);
  client.withGetAccount(accountId, function(data){
    response(req.headers.accept, res, "email_notifications/index", {
      serviceName: data.service_name
    });
  })
  .on('connectorError', ()=>{});
};

module.exports.edit = function (req, res) {
  var accountId = auth.get_account_id(req);
  req.session.emailNotification = "foo";
  Email.get(req).then(function(notification){
    response(req.headers.accept, res, "email_notifications/edit", {
      notification: notification
    });
  });
};
