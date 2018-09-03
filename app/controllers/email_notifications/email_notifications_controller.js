'use strict'

// NPM dependencies
const _ = require('lodash')
const logger = require('winston')

// Local dependencies
const response = require('../../utils/response.js').response
const Email = require('../../models/email.js')
const paths = require('../../paths.js')
const CORRELATION_HEADER = require('../../utils/correlation_header.js').CORRELATION_HEADER
const formattedPathFor = require('../../../app/utils/replace_params_in_path')

// Constants
const emailConfirmationToggleSubmitLink = formattedPathFor(paths.emailNotifications.confirmation)
const emailRefundToggleSubmitLink = formattedPathFor(paths.emailNotifications.refund)
const emailNotificationsIndexLink = formattedPathFor(paths.emailNotifications.index)
const emailCollectionModeSubmitLink = formattedPathFor(paths.emailNotifications.collection)
const indexPath = paths.emailNotifications.index

const showEmail = function (req, res, resource, locals) {
  const template = 'email_notifications/' + resource
  response(req, res, template, locals)
}

const showCollectionEmail = function (req, res, resource, locals) {
  const template = 'email_notifications/' + resource
  response(req, res, template, locals)
}

const showConfirmationEmail = function (req, res, resource, locals) {
  const template = 'email_notifications/' + resource
  response(req, res, template, locals)
}

const showRefundEmail = function (req, res, resource, locals) {
  const template = 'email_notifications/' + resource
  response(req, res, template, locals)
}

const toggleConfirmationEmail = function (req, res, enabled) {
  const accountID = req.account.gateway_account_id
  const correlationId = _.get(req, 'headers.' + CORRELATION_HEADER, '')
  const emailModel = Email(correlationId)
  emailModel.setConfirmationEnabled(accountID, enabled)
    .then(() => {
      logger.info(`[${correlationId}] - Updated confirmation email enabled(${enabled}). user=${req.session.passport.user}, gateway_account=${accountID}`)
      res.redirect(303, indexPath)
    })
}

module.exports.collectionEmailIndex = (req, res) => {
  showCollectionEmail(req, res, 'collection_email_mode', {
    emailCollectionModes: {
      mandatory: 0,
      optional: 1,
      no: 2
    },
    emailCollectionMode: req.account.emailCollectionMode,
    emailCollectionModeSubmitLink,
    emailNotificationsIndexLink
  })
}

module.exports.collectionEmailUpdate = (req, res) => {
  const emailCollectionMode = parseInt(req.body['email-collection-mode'])
  const accountID = req.account.gateway_account_id
  const correlationId = _.get(req, 'headers.' + CORRELATION_HEADER, '')
  const emailModel = Email(correlationId)
  emailModel.setEmailCollectionMode(accountID, emailCollectionMode)
    .then(() => {
      logger.info(`[${correlationId}] - Updated email collection mode (${emailCollectionMode}). user=${req.session.passport.user}, gateway_account=${accountID}`)
      res.redirect(303, indexPath)
    })
}

module.exports.confirmationEmailIndex = (req, res) => {
  showConfirmationEmail(req, res, 'confirmation_email_toggle', {
    confirmationEnabled: req.account.confirmationEmailEnabled,
    emailCollectionMode: req.account.emailCollectionMode,
    emailConfirmationToggleSubmitLink,
    emailNotificationsIndexLink
  })
}

module.exports.confirmationEmailUpdate = (req, res) => {
  const emailConfirmationEnabled = req.body['email-confirmation-enabled'] === 'true'
  if (!emailConfirmationEnabled) {
    showEmail(req, res, 'off_confirm', {})
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
  showRefundEmail(req, res, 'refund_email_toggle', {
    refundEmailEnabled: req.account.refundEmailEnabled,
    emailCollectionMode: req.account.emailCollectionMode,
    emailRefundToggleSubmitLink,
    emailNotificationsIndexLink
  })
}

module.exports.refundEmailUpdate = (req, res) => {
  const emailRefundEnabled = req.body['email-refund-enabled'] === 'true'
  const accountID = req.account.gateway_account_id
  const correlationId = _.get(req, 'headers.' + CORRELATION_HEADER, '')
  const emailModel = Email(correlationId)
  emailModel.setRefundEmailEnabled(accountID, emailRefundEnabled)
    .then(() => {
      logger.info(`[${correlationId}] - Updated refund email enabled(${emailRefundEnabled}). user=${req.session.passport.user}, gateway_account=${accountID}`)
      res.redirect(303, indexPath)
    })
}

module.exports.index = (req, res) => {
  showEmail(req, res, 'index', {
    confirmationTabActive: true,
    customEmailText: req.account.customEmailText,
    serviceName: req.account.service_name,
    emailEnabled: req.account.emailEnabled,
    emailCollectionMode: req.account.emailCollectionMode,
    refundEmailEnabled: req.account.refundEmailEnabled
  })
}

module.exports.indexRefundTabEnabled = (req, res) => {
  showEmail(req, res, 'index', {
    confirmationTabActive: false,
    customEmailText: req.account.customEmailText,
    serviceName: req.account.service_name,
    emailEnabled: req.account.emailEnabled,
    emailCollectionMode: req.account.emailCollectionMode,
    refundEmailEnabled: req.account.refundEmailEnabled
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

module.exports.update = (req, res) => {
  const newEmailText = req.body['custom-email-text']
  const accountID = req.account.gateway_account_id
  const correlationId = _.get(req, 'headers.' + CORRELATION_HEADER, '')
  const emailModel = Email(correlationId)
  emailModel.update(accountID, newEmailText)
    .then(() => {
      logger.info(`[${correlationId}] - Updated email notifications custom paragraph. user=${req.session.passport.user}, gateway_account=${accountID}`)
      res.redirect(303, indexPath)
    })
}
