'use strict'

const logger = require('../utils/logger')(__filename)
const ConnectorClient = require('./clients/connector.client.js').ConnectorClient

// Constants
const ACCOUNT_API_PATH = '/v1/api/accounts/{accountId}'
const EMAIL_NOTIFICATION_UPDATE_API_PATH = ACCOUNT_API_PATH + '/email-notification'

const notificationUpdateUrl = function (accountID) {
  return process.env.CONNECTOR_URL + EMAIL_NOTIFICATION_UPDATE_API_PATH.replace('{accountId}', accountID)
}

const connectorClient = new ConnectorClient(process.env.CONNECTOR_URL)

const getEmailSettings = async function (accountID, correlationId) {
  const startTime = new Date()
  try {
    const data = await connectorClient.getAccount({
      gatewayAccountId: accountID,
      correlationId: correlationId
    })
    logger.info(`[${correlationId}] - GET account %s ended - elapsed time: %s ms`, accountID, new Date() - startTime)
    return {
      customEmailText: data.email_notifications.PAYMENT_CONFIRMED.template_body,
      emailEnabled: data.email_notifications.PAYMENT_CONFIRMED.enabled,
      emailCollectionMode: data.email_collection_mode,
      refundEmailEnabled: data.email_notifications.REFUND_ISSUED && data.email_notifications.REFUND_ISSUED.enabled
    }
  } catch (err) {
    logger.info(`[${correlationId}] - GET account %s ended - elapsed time: %s ms`, accountID, new Date() - startTime)
    clientFailure(err, 'GET', false)
  }
}

const updateConfirmationTemplate = async function (accountID, emailText, correlationId) {
  const startTime = new Date()
  try {
    const patch = { 'op': 'replace', 'path': '/payment_confirmed/template_body', 'value': emailText }

    await connectorClient.updateConfirmationEmail({
      payload: patch,
      correlationId: correlationId,
      gatewayAccountId: accountID
    })

    logger.info(`[${correlationId}] - PATCH to %s ended - elapsed time: %s ms`, notificationUpdateUrl(accountID), new Date() - startTime)
  } catch (err) {
    logger.info(`[${correlationId}] - PATCH to %s ended - elapsed time: %s ms`, notificationUpdateUrl(accountID), new Date() - startTime)
    clientFailure(err, 'PATCH', true)
  }
}

const setEmailCollectionMode = async function (accountID, collectionMode, correlationId) {
  const startTime = new Date()
  try {
    const patch = { 'op': 'replace', 'path': 'email_collection_mode', 'value': collectionMode }
    await connectorClient.updateEmailCollectionMode({
      payload: patch,
      correlationId: correlationId,
      gatewayAccountId: accountID
    })
    logger.info(`[${correlationId}] - PATCH to account %s ended - elapsed time: %s ms`, accountID, new Date() - startTime)
  } catch (err) {
    logger.info(`[${correlationId}] - PATCH to account %s ended - elapsed time: %s ms`, accountID, new Date() - startTime)
    clientFailure(err, 'PATCH', false)
  }
}

const setConfirmationEnabled = async function (accountID, enabled, correlationId) {
  const startTime = new Date()
  const patch = { 'op': 'replace', 'path': '/payment_confirmed/enabled', 'value': enabled }

  try {
    await connectorClient.updateConfirmationEmailEnabled({
      payload: patch,
      correlationId: correlationId,
      gatewayAccountId: accountID
    })
    logger.info(`[${correlationId}] - PATCH to %s ended - elapsed time: %s ms`, notificationUpdateUrl(accountID), new Date() - startTime)
  } catch (err) {
    logger.info(`[${correlationId}] - PATCH to %s ended - elapsed time: %s ms`, notificationUpdateUrl(accountID), new Date() - startTime)
    clientFailure(err, 'PATCH', true)
  }
}

const setRefundEmailEnabled = async function (accountID, enabled, correlationId) {
  const startTime = new Date()
  try {
    const patch = { 'op': 'replace', 'path': '/refund_issued/enabled', 'value': enabled }
    await connectorClient.updateRefundEmailEnabled({
      payload: patch,
      correlationId: correlationId,
      gatewayAccountId: accountID
    })
    logger.info(`[${correlationId}] - PATCH to %s ended - elapsed time: %s ms`, notificationUpdateUrl(accountID), new Date() - startTime)
  } catch (err) {
    logger.info(`[${correlationId}] - PATCH to %s ended - elapsed time: %s ms`, notificationUpdateUrl(accountID), new Date() - startTime)
    clientFailure(err, 'PATCH', true)
  }
}

const clientFailure = function (err, methodType, isPatchEndpoint) {
  const errMsg = isPatchEndpoint
    ? `Calling connector to update email notifications for an account threw exception`
    : `Calling connector to get/patch account data threw exception`
  logger.error(errMsg, {
    service: 'connector',
    method: methodType,
    error: err
  })
  throw new Error(errMsg)
}

module.exports = {
  getEmailSettings,
  updateConfirmationTemplate,
  setEmailCollectionMode,
  setConfirmationEnabled,
  setRefundEmailEnabled
}
