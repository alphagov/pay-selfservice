var logger          = require('winston');
var csrf            = require('csrf');
var response        = require('../utils/response.js').response;
var Email           = require('../models/email.js');
var ConnectorClient = require('../services/connector_client.js').ConnectorClient;
var client          = new ConnectorClient(process.env.CONNECTOR_URL);
var auth            = require('../services/auth_service.js');
var router          = require('../routes.js');

var showEmail = function(req, res, resource, emailText){
  var template =  "email_notifications/" + resource;
  response(req.headers.accept, res, template, {
    customEmailText: emailText,
    serviceName: req.account.service_name
  });
};

module.exports.index = (req, res) => {
  showEmail(req, res, 'index', req.account.customEmailText);
};

module.exports.edit = (req, res) => {
  showEmail(req, res, 'edit', req.account.customEmailText);
};

module.exports.confirm = (req, res) => {
  showEmail(req, res,  "confirm", req.body['custom-email-text']);
};

module.exports.update = (req, res) => {
  var indexPath = router.paths.emailNotifications.index,
  newEmailText  = req.body["custom-email-text"],
  accountID = req.account.gateway_account_id;
  Email.update(accountID, newEmailText)
  .then((customEmailText) => {
    res.redirect(303, indexPath);
  });
};

