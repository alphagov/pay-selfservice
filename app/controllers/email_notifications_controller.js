const response = require('../utils/response.js').response
const Email = require('../models/email.js')
const router = require('../routes.js')
const CORRELATION_HEADER = require('../utils/correlation_header.js').CORRELATION_HEADER

const showEmail = function (req, res, resource, locals) {
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

const toggleEmail = function (req, res, enabled) {
  const indexPath = router.paths.emailNotifications.index
  const accountID = req.account.gateway_account_id

  const emailModel = Email(req.headers[CORRELATION_HEADER])
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
  const indexPath = router.paths.emailNotifications.index
  const newEmailText = req.body['custom-email-text']
  const accountID = req.account.gateway_account_id

  const emailModel = Email(req.headers[CORRELATION_HEADER])
  emailModel.update(accountID, newEmailText)
  .then(() => {
    res.redirect(303, indexPath)
  })
}
