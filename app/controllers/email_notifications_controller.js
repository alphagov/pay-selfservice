var logger          = require('winston');
var csrf            = require('csrf');
var response        = require('../utils/response.js').response;
var Email           = require('../models/email.js');
var ConnectorClient = require('../services/connector_client.js').ConnectorClient;
var client          = new ConnectorClient(process.env.CONNECTOR_URL);
var auth            = require('../services/auth_service.js');
var router          = require('../routes.js');

var showEmail = function(req, res, resource, locals){
  var template =  "email_notifications/" + resource;
  response(req.headers.accept, res, template, locals);
};

module.exports.index = (req, res) => {
  showEmail(req, res, 'index', {
    customEmailText: req.account.customEmailText,
    serviceName: req.account.service_name,
    emailEnabled: req.account.emailEnabled
  });
};

module.exports.edit = (req, res) => {
  showEmail(req, res, 'edit', {
    customEmailText: req.account.customEmailText,
    serviceName: req.account.service_name
  });
};

module.exports.confirm = (req, res) => {
  showEmail(req, res,  "confirm", {
    customEmailText: req.body['custom-email-text'],
    serviceName: req.account.service_name
  });
};

module.exports.offConfirm = (req, res) => {
  showEmail(req, res,  "off_confirm", {});
};


toggleEmail = function(req,res,enabled){
  var indexPath = router.paths.emailNotifications.index,
  accountID = req.account.gateway_account_id;
  Email.setEnabled(accountID,enabled)
  .then(() => {
    res.redirect(303, indexPath);
  });

};

module.exports.off = (req, res) => {
  toggleEmail(req, res, false);
};

module.exports.on = (req, res) => {
  toggleEmail(req, res, true);
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

