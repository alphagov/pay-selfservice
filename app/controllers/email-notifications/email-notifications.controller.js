'use strict'

const _ = require('lodash')

const logger = require('../../utils/logger')(__filename)
const response = require('../../utils/response.js').response
const emailService = require('../../services/email.service.js')
const paths = require('../../paths.js')
const CORRELATION_HEADER = require('../../utils/correlation-header.js').CORRELATION_HEADER

// Constants
const indexPath = paths.settings.index

const showEmail = function (req, res, resource, locals) {
  const template = 'email-notifications/' + resource
  response(req, res, template, locals)
}

const showCollectionEmail = function (req, res, resource, locals) {
  const template = 'email-notifications/' + resource
  response(req, res, template, locals)
}

const showConfirmationEmail = function (req, res, resource, locals) {
  const template = 'email-notifications/' + resource
  response(req, res, template, locals)
}

const showRefundEmail = function (req, res, resource, locals) {
  const template = 'email-notifications/' + resource
  response(req, res, template, locals)
}

const toggleConfirmationEmail = function (req, res, enabled) {
  const accountID = req.account.gateway_account_id
  const correlationId = _.get(req, 'headers.' + CORRELATION_HEADER, '')
  emailService.setConfirmationEnabled(accountID, enabled, correlationId)
    .then(() => {
      logger.info(`[${correlationId}] - Updated confirmation email enabled(${enabled}). user=${req.session.passport.user}, gateway_account=${accountID}`)
      res.redirect(303, indexPath)
    })
}

module.exports.collectionEmailIndex = (req, res) => {
  showCollectionEmail(req, res, 'collection-email-mode', {
    emailCollectionModes: {
      mandatory: 'MANDATORY',
      optional: 'OPTIONAL',
      no: 'OFF'
    },
    emailCollectionMode: req.account.email_collection_mode
  })
}

module.exports.collectionEmailUpdate = (req, res) => {
  const emailCollectionMode = req.body['email-collection-mode']
  const accountID = req.account.gateway_account_id
  const correlationId = _.get(req, 'headers.' + CORRELATION_HEADER, '')
  emailService.setEmailCollectionMode(accountID, emailCollectionMode, correlationId)
    .then(() => {
      logger.info(`[${correlationId}] - Updated email collection mode (${emailCollectionMode}). user=${req.session.passport.user}, gateway_account=${accountID}`)
      res.redirect(303, indexPath)
    })
}

module.exports.confirmationEmailIndex = (req, res) => {
  showConfirmationEmail(req, res, 'confirmation-email-toggle', {
    confirmationEnabled: req.account.email_notifications.PAYMENT_CONFIRMED.enabled,
    emailCollectionMode: req.account.email_collection_mode
  })
}

module.exports.confirmationEmailUpdate = (req, res) => {
  const emailConfirmationEnabled = req.body['email-confirmation-enabled'] === 'true'
  if (!emailConfirmationEnabled) {
    showEmail(req, res, 'off-confirm', {})
  } else {
    toggleConfirmationEmail(req, res, true)
  }
}

module.exports.confirmationEmailOn = (req, res) => {
  toggleConfirmationEmail(req, res, true)
}

module.exports.confirmationEmailOff = (req, res) => {
  toggleConfirmationEmail(req, res, false)
}

module.exports.refundEmailIndex = (req, res) => {
  showRefundEmail(req, res, 'refund-email-toggle', {
    refundEmailEnabled: req.account.email_notifications.REFUND_ISSUED && req.account.email_notifications.REFUND_ISSUED.enabled,
    emailCollectionMode: req.account.email_collection_mode
  })
}

module.exports.refundEmailUpdate = (req, res) => {
  const emailRefundEnabled = req.body['email-refund-enabled'] === 'true'
  const accountID = req.account.gateway_account_id
  const correlationId = _.get(req, 'headers.' + CORRELATION_HEADER, '')
  emailService.setRefundEmailEnabled(accountID, emailRefundEnabled, correlationId)
    .then(() => {
      logger.info(`[${correlationId}] - Updated refund email enabled(${emailRefundEnabled}). user=${req.session.passport.user}, gateway_account=${accountID}`)
      res.redirect(303, indexPath)
    })
}

module.exports.index = (req, res) => {
  showEmail(req, res, 'index', {
    confirmationTabActive: true,
    customEmailText: req.account.email_notifications.PAYMENT_CONFIRMED.template_body,
    serviceName: req.account.service_name,
    emailEnabled: req.account.email_notifications.PAYMENT_CONFIRMED.enabled,
    emailCollectionMode: req.account.email_collection_mode,
    refundEmailEnabled: req.account.email_notifications.REFUND_ISSUED && req.account.email_notifications.REFUND_ISSUED.enabled
  })
}

module.exports.indexRefundTabEnabled = (req, res) => {
  showEmail(req, res, 'index', {
    confirmationTabActive: false,
    customEmailText: req.account.email_notifications.PAYMENT_CONFIRMED.template_body,
    serviceName: req.account.service_name,
    emailEnabled: req.account.email_notifications.PAYMENT_CONFIRMED.enabled,
    emailCollectionMode: req.account.email_collection_mode,
    refundEmailEnabled: req.account.email_notifications.REFUND_ISSUED && req.account.email_notifications.REFUND_ISSUED.enabled
  })
}

module.exports.edit = (req, res) => {
  showEmail(req, res, 'edit', {
    customEmailText: req.account.email_notifications.PAYMENT_CONFIRMED.template_body,
    serviceName: req.account.service_name
  })
}

module.exports.confirm = (req, res) => {
  showEmail(req, res, 'confirm', {
    customEmailText: req.body['custom-email-text'],
    serviceName: req.account.service_name
  })
}

module.exports.update = (req, res) => {
  const newEmailText = req.body['custom-email-text']
  const accountID = req.account.gateway_account_id
  const correlationId = _.get(req, 'headers.' + CORRELATION_HEADER, '')
  emailService.updateConfirmationTemplate(accountID, newEmailText, correlationId)
    .then(() => {
      logger.info(`[${correlationId}] - Updated email notifications custom paragraph. user=${req.session.passport.user}, gateway_account=${accountID}`)
      res.redirect(303, indexPath)
    })
}
