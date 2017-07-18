var response = require('../utils/response.js').response
var Email = require('../models/email.js')
var router = require('../routes.js')
var CORRELATION_HEADER = require('../utils/correlation_header.js').CORRELATION_HEADER

var showEmail = function (req, res, resource, locals) {
  var template = 'email_notifications/' + resource
  response(req, res, template, locals)
}

module.exports.index = (req, res) => {
  showEmail(req, res, 'index', {
    customEmailText: req.account.customEmailText,
    serviceName: req.account.service_name,
    emailEnabled: req.account.emailEnabled
  })
}

module.exports.edit = (req, res) => {
  showEmail(req, res, 'edit', {
    customEmailText: req.account.customEmailText,
    serviceName: req.account.service_name
  })
}

module.exports.confirm = (req, res) => {
  showEmail(req, res, 'confirm', {
    customEmailText: req.body['custom-email-text'],
    serviceName: req.account.service_name
  })
}

module.exports.offConfirm = (req, res) => {
  showEmail(req, res, 'off_confirm', {})
}

var toggleEmail = function (req, res, enabled) {
  var indexPath = router.paths.emailNotifications.index
  var accountID = req.account.gateway_account_id

  var emailModel = Email(req.headers[CORRELATION_HEADER])
  emailModel.setEnabled(accountID, enabled)
  .then(() => {
    res.redirect(303, indexPath)
  })
}

module.exports.off = (req, res) => {
  toggleEmail(req, res, false)
}

module.exports.on = (req, res) => {
  toggleEmail(req, res, true)
}

module.exports.update = (req, res) => {
  var indexPath = router.paths.emailNotifications.index
  var newEmailText = req.body['custom-email-text']
  var accountID = req.account.gateway_account_id

  var emailModel = Email(req.headers[CORRELATION_HEADER])
  emailModel.update(accountID, newEmailText)
  .then((customEmailText) => {
    res.redirect(303, indexPath)
  })
}
