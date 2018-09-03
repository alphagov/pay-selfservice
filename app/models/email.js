'use strict'

// NPM dependencies
const logger = require('winston')

// Local dependencies
const ConnectorClient = require('../services/clients/connector_client.js').ConnectorClient

// Constants
const EMAIL_NOTIFICATION_API_PATH = '/v1/api/accounts/{accountId}/email-notification'

const connectorUrl = function (accountID) {
  return process.env.CONNECTOR_URL + EMAIL_NOTIFICATION_API_PATH.replace('{accountId}', accountID)
}

const connectorClient = function () {
  return new ConnectorClient(process.env.CONNECTOR_URL)
}

module.exports = function (correlationId) {
  correlationId = correlationId || ''

  const get = function (accountID) {
    return new Promise(function (resolve, reject) {
      const startTime = new Date()
      connectorClient().getNotificationEmail({
        gatewayAccountId: accountID,
        correlationId: correlationId
      }, function (data) {
        logger.info(`[${correlationId}] - GET to %s ended - elapsed time: %s ms`, connectorUrl(accountID), new Date() - startTime)
        resolve({
          customEmailText: data.template_body,
          emailEnabled: data.enabled,
          emailCollectionMode: data.emailCollectionMode,
          refundEmailEnabled: data.refundEmailEnabled
        })
      }).on('connectorError', function (err, connectorResponse) {
        logger.info(`[${correlationId}] - GET to %s ended - elapsed time: %s ms`, connectorUrl(accountID), new Date() - startTime)

        // distinguish between bad response and failed connection
        if (connectorResponse) {
          return reject(new Error('GET_FAILED'))
        }
        clientUnavailable(err, reject, 'GET', correlationId)
      })
    })
  }

  const update = function (accountID, emailText) {
    return new Promise(function (resolve, reject) {
      const startTime = new Date()
      connectorClient().updateNotificationEmail({
        payload: {'custom-email-text': emailText},
        correlationId: correlationId,
        gatewayAccountId: accountID
      },
      function () {
        logger.info(`[${correlationId}] - POST to %s ended - elapsed time: %s ms`, connectorUrl(accountID), new Date() - startTime)
        resolve()
      }).on('connectorError', function (err, connectorResponse) {
        if (connectorResponse) return reject(new Error('POST_FAILED'))

        logger.info(`[${correlationId}] - POST to %s ended - elapsed time: %s ms`, connectorUrl(accountID), new Date() - startTime)
        clientUnavailable(err, reject, 'POST', correlationId)
      })
    })
  }

  const setEmailCollectionMode = function (accountID, collectionMode) {
    return new Promise(function (resolve, reject) {
      logger.debug('model', connectorUrl(accountID), {'op': 'replace', 'path': 'collection', 'value': collectionMode})
      const startTime = new Date()
      const patch = {'op': 'replace', 'path': 'collection', 'value': collectionMode}
      connectorClient().updateEmailCollectionMode({
        payload: patch,
        correlationId: correlationId,
        gatewayAccountId: accountID
      }, function () {
        logger.info(`[${correlationId}] - PATCH to %s ended - elapsed time: %s ms`, connectorUrl(accountID), new Date() - startTime)
        resolve()
      }).on('connectorError', function (err, connectorResponse) {
        if (connectorResponse) return reject(new Error('PATCH_FAILED'))
        logger.info(`[${correlationId}] - PATCH to %s ended - elapsed time: %s ms`, connectorUrl(accountID), new Date() - startTime)
        clientUnavailable(err, reject, 'PATCH', correlationId)
      })
    })
  }

  const setConfirmationEnabled = function (accountID, enabled) {
    return new Promise(function (resolve, reject) {
      logger.debug('model', connectorUrl(accountID), {'op': 'replace', 'path': 'enabled', 'value': enabled})
      const startTime = new Date()
      const patch = {'op': 'replace', 'path': 'enabled', 'value': enabled}
      connectorClient().updateNotificationEmailEnabled({
        payload: patch,
        correlationId: correlationId,
        gatewayAccountId: accountID
      }, function () {
        logger.info(`[${correlationId}] - PATCH to %s ended - elapsed time: %s ms`, connectorUrl(accountID), new Date() - startTime)
        resolve()
      }).on('connectorError', function (err, connectorResponse) {
        if (connectorResponse) return reject(new Error('PATCH_FAILED'))
        logger.info(`[${correlationId}] - PATCH to %s ended - elapsed time: %s ms`, connectorUrl(accountID), new Date() - startTime)
        clientUnavailable(err, reject, 'PATCH', correlationId)
      })
    })
  }

  const setRefundEmailEnabled = function (accountID, enabled) {
    return new Promise(function (resolve, reject) {
      logger.debug('model', connectorUrl(accountID), {'op': 'replace', 'path': 'refund', 'value': enabled})
      const startTime = new Date()
      const patch = {'op': 'replace', 'path': 'refund', 'value': enabled}
      connectorClient().updateRefundEmailEnabled({
        payload: patch,
        correlationId: correlationId,
        gatewayAccountId: accountID
      }, function () {
        logger.info(`[${correlationId}] - PATCH to %s ended - elapsed time: %s ms`, connectorUrl(accountID), new Date() - startTime)
        resolve()
      }).on('connectorError', function (err, connectorResponse) {
        if (connectorResponse) return reject(new Error('PATCH_FAILED'))
        logger.info(`[${correlationId}] - PATCH to %s ended - elapsed time: %s ms`, connectorUrl(accountID), new Date() - startTime)
        clientUnavailable(err, reject, 'PATCH', correlationId)
      })
    })
  }

  const clientUnavailable = function (error, reject, methodType, correlationId) {
    logger.error(`[${correlationId}] Calling connector to email notification for an account threw exception -`, {
      service: 'connector',
      method: methodType,
      error: error
    })
    reject(new Error('CLIENT_UNAVAILABLE'), error)
  }

  return {
    get: get,
    update: update,
    setEmailCollectionMode: setEmailCollectionMode,
    setConfirmationEnabled: setConfirmationEnabled,
    setRefundEmailEnabled: setRefundEmailEnabled
  }
}
