'use strict'

const logger = require('@utils/logger')(__filename)
const response = require('@utils/response.js').response
const emailService = require('@services/email.service.js')
const paths = require('@root/paths.js')
const formatAccountPathsFor = require('@utils/format-account-paths-for')
const humaniseEmailMode = require('@utils/humanise-email-mode')
const { validateOptionalField } = require('@utils/validation/server-side-form-validations')

const CUSTOM_PARAGRAPH_MAX_LENGTH = 5000

async function toggleConfirmationEmail (req, res, next, enabled) {
  const accountID = req.account.gateway_account_id
  try {
    await emailService.setConfirmationEnabled(accountID, enabled)
    logger.info(`Updated confirmation email enabled(${enabled})`)
    req.flash('generic', `Payment confirmation emails are turned ${enabled ? 'on' : 'off'}`)
    res.redirect(303, formatAccountPathsFor(paths.account.settings.index, req.account && req.account.external_id))
  } catch (err) {
    next(err)
  }
}

function collectionEmailIndex (req, res) {
  response(req, res, 'email-notifications/collection-email-mode', {
    emailCollectionModes: {
      mandatory: 'MANDATORY',
      optional: 'OPTIONAL',
      no: 'OFF'
    },
    emailCollectionMode: req.account.email_collection_mode
  })
}

async function collectionEmailUpdate (req, res, next) {
  const emailCollectionMode = req.body['email-collection-mode']
  const accountID = req.account.gateway_account_id
  try {
    await emailService.setEmailCollectionMode(accountID, emailCollectionMode)
    logger.info(`Updated email collection mode (${emailCollectionMode})`)
    req.flash('generic', `Email address collection is set to ${humaniseEmailMode(emailCollectionMode).toLowerCase()}`)
    res.redirect(303, formatAccountPathsFor(paths.account.settings.index, req.account && req.account.external_id))
  } catch (err) {
    next(err)
  }
}

function confirmationEmailIndex (req, res) {
  response(req, res, 'email-notifications/confirmation-email-toggle', {
    confirmationEnabled: req.account.email_notifications.PAYMENT_CONFIRMED.enabled,
    emailCollectionMode: req.account.email_collection_mode
  })
}

function confirmationEmailUpdate (req, res, next) {
  const emailConfirmationEnabled = req.body['email-confirmation-enabled'] === 'true'
  if (!emailConfirmationEnabled) {
    response(req, res, 'email-notifications/off-confirm', {})
  } else {
    toggleConfirmationEmail(req, res, next, true)
  }
}

function confirmationEmailOff (req, res, next) {
  toggleConfirmationEmail(req, res, next, false)
}

function refundEmailIndex (req, res) {
  response(req, res, 'email-notifications/refund-email-toggle', {
    refundEmailEnabled: req.account.email_notifications.REFUND_ISSUED && req.account.email_notifications.REFUND_ISSUED.enabled,
    emailCollectionMode: req.account.email_collection_mode
  })
}

async function refundEmailUpdate (req, res, next) {
  const emailRefundEnabled = req.body['email-refund-enabled'] === 'true'
  const accountID = req.account.gateway_account_id
  try {
    await emailService.setRefundEmailEnabled(accountID, emailRefundEnabled)
    logger.info(`Updated refund email enabled(${emailRefundEnabled})`)
    req.flash('generic', `Refund emails are turned ${emailRefundEnabled ? 'on' : 'off'}`)
    res.redirect(303, formatAccountPathsFor(paths.account.settings.index, req.account && req.account.external_id))
  } catch (err) {
    next(err)
  }
}

function showConfirmationEmailTemplate (req, res) {
  response(req, res, 'email-notifications/index', {
    confirmationTabActive: true,
    customEmailText: req.account.email_notifications.PAYMENT_CONFIRMED.template_body,
    serviceName: req.account.service_name,
    emailEnabled: req.account.email_notifications.PAYMENT_CONFIRMED.enabled,
    emailCollectionMode: req.account.email_collection_mode,
    refundEmailEnabled: req.account.email_notifications.REFUND_ISSUED && req.account.email_notifications.REFUND_ISSUED.enabled
  })
}

function showRefundEmailTemplate (req, res) {
  response(req, res, 'email-notifications/index', {
    confirmationTabActive: false,
    customEmailText: req.account.email_notifications.PAYMENT_CONFIRMED.template_body,
    serviceName: req.account.service_name,
    emailEnabled: req.account.email_notifications.PAYMENT_CONFIRMED.enabled,
    emailCollectionMode: req.account.email_collection_mode,
    refundEmailEnabled: req.account.email_notifications.REFUND_ISSUED && req.account.email_notifications.REFUND_ISSUED.enabled
  })
}

function editCustomParagraph (req, res) {
  response(req, res, 'email-notifications/edit', {
    customEmailText: req.account.email_notifications.PAYMENT_CONFIRMED.template_body,
    serviceName: req.account.service_name
  })
}

function confirmCustomParagraph (req, res) {
  const customEmailText = req.body['custom-email-text']
  const validationResult = validateOptionalField(customEmailText, CUSTOM_PARAGRAPH_MAX_LENGTH, 'custom paragraph')
  if (!validationResult.valid) {
    return response(req, res, 'email-notifications/edit', {
      errors: {
        customEmailText: validationResult.message
      },
      customEmailText,
      serviceName: req.account.service_name
    })
  }

  response(req, res, 'email-notifications/confirm', {
    customEmailText: req.body['custom-email-text'],
    serviceName: req.account.service_name
  })
}

async function updateCustomParagraph (req, res, next) {
  const newEmailText = req.body['custom-email-text']
  const accountID = req.account.gateway_account_id
  try {
    await emailService.updateConfirmationTemplate(accountID, newEmailText)
    logger.info('Updated email notifications custom paragraph')
    req.flash('generic', 'Payment confirmation email template updated')
    res.redirect(303, formatAccountPathsFor(paths.account.settings.index, req.account && req.account.external_id))
  } catch (err) {
    next(err)
  }
}

module.exports = {
  collectionEmailIndex,
  collectionEmailUpdate,
  confirmationEmailIndex,
  confirmationEmailUpdate,
  confirmationEmailOff,
  refundEmailIndex,
  refundEmailUpdate,
  showConfirmationEmailTemplate,
  showRefundEmailTemplate,
  editCustomParagraph,
  confirmCustomParagraph,
  updateCustomParagraph
}
