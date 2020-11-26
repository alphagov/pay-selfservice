'use strict'

const logger = require('../utils/logger')(__filename)
const ConnectorClient = require('./clients/connector.client.js').ConnectorClient

// Constants
const ACCOUNT_API_PATH = '/v1/api/accounts/{accountId}'
const EMAIL_NOTIFICATION_UPDATE_API_PATH = ACCOUNT_API_PATH + '/email-notification'

const notificationUpdateUrl = function (accountID) {
  return process.env.CONNECTOR_URL + EMAIL_NOTIFICATION_UPDATE_API_PATH.replace('{accountId}', accountID)
}

// this module uses the old base client pub/ sub `on` error propagation, in certain
// cases this relies on the instance of the client being unique to correctly
// handle errors. This instantiation should be removed when the newer promise
// based client is used
const newConnectorClient = function () {
  return new ConnectorClient(process.env.CONNECTOR_URL)
}

const getEmailSettings = function (accountID, correlationId) {
  return new Promise(function (resolve, reject) {
    const startTime = new Date()
    newConnectorClient().getAccount({
      gatewayAccountId: accountID,
      correlationId: correlationId
    })
      .then(data => {
        logger.info(`[${correlationId}] - GET account %s ended - elapsed time: %s ms`, accountID, new Date() - startTime)
        resolve({
          customEmailText: data.email_notifications.PAYMENT_CONFIRMED.template_body,
          emailEnabled: data.email_notifications.PAYMENT_CONFIRMED.enabled,
          emailCollectionMode: data.email_collection_mode,
          refundEmailEnabled: data.email_notifications.REFUND_ISSUED && data.email_notifications.REFUND_ISSUED.enabled
        })
      })
      .catch(err => {
        logger.info(`[${correlationId}] - GET account %s ended - elapsed time: %s ms`, accountID, new Date() - startTime)
        clientFailure(err, reject, 'GET', correlationId, false)
      })
  })
}

const updateConfirmationTemplate = function (accountID, emailText, correlationId) {
  return new Promise(function (resolve, reject) {
    const startTime = new Date()
    const patch = { 'op': 'replace', 'path': '/payment_confirmed/template_body', 'value': emailText }
    newConnectorClient().updateConfirmationEmail({
      payload: patch,
      correlationId: correlationId,
      gatewayAccountId: accountID
    },
    function () {
      logger.info(`[${correlationId}] - PATCH to %s ended - elapsed time: %s ms`, notificationUpdateUrl(accountID), new Date() - startTime)
      resolve()
    }).on('connectorError', function (err, connectorResponse) {
      if (connectorResponse) return reject(new Error('POST_FAILED'))

      logger.info(`[${correlationId}] - PATCH to %s ended - elapsed time: %s ms`, notificationUpdateUrl(accountID), new Date() - startTime)
      clientFailure(err, reject, 'PATCH', correlationId, true)
    })
  })
}

const setEmailCollectionMode = function (accountID, collectionMode, correlationId) {
  return new Promise(function (resolve, reject) {
    const startTime = new Date()
    const patch = { 'op': 'replace', 'path': 'email_collection_mode', 'value': collectionMode }
    newConnectorClient().updateEmailCollectionMode({
      payload: patch,
      correlationId: correlationId,
      gatewayAccountId: accountID
    }, function () {
      logger.info(`[${correlationId}] - PATCH to account %s ended - elapsed time: %s ms`, accountID, new Date() - startTime)
      resolve()
    }).on('connectorError', function (err, connectorResponse) {
      if (connectorResponse) return reject(new Error('PATCH_FAILED'))
      logger.info(`[${correlationId}] - PATCH to account %s ended - elapsed time: %s ms`, accountID, new Date() - startTime)
      clientFailure(err, reject, 'PATCH', correlationId, false)
    })
  })
}

const setConfirmationEnabled = function (accountID, enabled, correlationId) {
  return new Promise(function (resolve, reject) {
    const startTime = new Date()
    const patch = { 'op': 'replace', 'path': '/payment_confirmed/enabled', 'value': enabled }
    newConnectorClient().updateConfirmationEmailEnabled({
      payload: patch,
      correlationId: correlationId,
      gatewayAccountId: accountID
    }, function () {
      logger.info(`[${correlationId}] - PATCH to %s ended - elapsed time: %s ms`, notificationUpdateUrl(accountID), new Date() - startTime)
      resolve()
    }).on('connectorError', function (err, connectorResponse) {
      if (connectorResponse) return reject(new Error('PATCH_FAILED'))
      logger.info(`[${correlationId}] - PATCH to %s ended - elapsed time: %s ms`, notificationUpdateUrl(accountID), new Date() - startTime)
      clientFailure(err, reject, 'PATCH', correlationId, true)
    })
  })
}

const setRefundEmailEnabled = function (accountID, enabled, correlationId) {
  return new Promise(function (resolve, reject) {
    const startTime = new Date()
    const patch = { 'op': 'replace', 'path': '/refund_issued/enabled', 'value': enabled }
    newConnectorClient().updateRefundEmailEnabled({
      payload: patch,
      correlationId: correlationId,
      gatewayAccountId: accountID
    }, function () {
      logger.info(`[${correlationId}] - PATCH to %s ended - elapsed time: %s ms`, notificationUpdateUrl(accountID), new Date() - startTime)
      resolve()
    }).on('connectorError', function (err, connectorResponse) {
      if (connectorResponse) return reject(new Error('PATCH_FAILED'))
      logger.info(`[${correlationId}] - PATCH to %s ended - elapsed time: %s ms`, notificationUpdateUrl(accountID), new Date() - startTime)
      clientFailure(err, reject, 'PATCH', correlationId, true)
    })
  })
}

const clientFailure = function (error, reject, methodType, correlationId, isPatchEndpoint) {
  const errMsg = isPatchEndpoint
    ? `[${correlationId}] Calling connector to update email notifications for an account threw exception`
    : `[${correlationId}] Calling connector to get/patch account data threw exception`
  logger.error(errMsg, {
    service: 'connector',
    method: methodType,
    error: error
  })
  reject(new Error('CONNECTOR_FAILED'), error)
}

module.exports = {
  getEmailSettings,
  updateConfirmationTemplate,
  setEmailCollectionMode,
  setConfirmationEnabled,
  setRefundEmailEnabled
}
