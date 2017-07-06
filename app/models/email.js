var q = require('q')
var logger = require('winston')
var EMAIL_NOTIFICATION_API_PATH = '/v1/api/accounts/{accountId}/email-notification'
var ConnectorClient = require('../services/clients/connector_client').ConnectorClient

var connectorUrl = function (accountID) {
  return process.env.CONNECTOR_URL + EMAIL_NOTIFICATION_API_PATH.replace('{accountId}', accountID)
}

var connectorClient = function () {
  return new ConnectorClient(process.env.CONNECTOR_URL)
}

module.exports = function (correlationId) {
  correlationId = correlationId || ''

  var get = function (accountID) {
    var defer = q.defer()
    var startTime = new Date()

    connectorClient().getNotificationEmail({
      gatewayAccountId: accountID,
      correlationId: correlationId
    }, function (data, response) {
      logger.info(`[${correlationId}] - GET to %s ended - elapsed time: %s ms`, connectorUrl(accountID), new Date() - startTime)

      defer.resolve({
        customEmailText: data.template_body,
        emailEnabled: data.enabled
      })
    }).on('connectorError', function (err, connectorResponse) {
      logger.info(`[${correlationId}] - GET to %s ended - elapsed time: %s ms`, connectorUrl(accountID), new Date() - startTime)

      // distinguish between bad response and failed connection
      if (connectorResponse) {
        return defer.reject(new Error('GET_FAILED'))
      }
      clientUnavailable(err, defer, 'GET', correlationId)
    })
    return defer.promise
  }

  var update = function (accountID, emailText) {
    var defer = q.defer()
    var startTime = new Date()

    connectorClient().updateNotificationEmail({
      payload: {'custom-email-text': emailText},
      correlationId: correlationId,
      gatewayAccountId: accountID
    },
      function (data, response) {
        logger.info(`[${correlationId}] - POST to %s ended - elapsed time: %s ms`, connectorUrl(accountID), new Date() - startTime)
        defer.resolve()
      }).on('connectorError', function (err, connectorResponse) {
        if (connectorResponse) return defer.reject(new Error('POST_FAILED'))

        logger.info(`[${correlationId}] - POST to %s ended - elapsed time: %s ms`, connectorUrl(accountID), new Date() - startTime)
        clientUnavailable(err, defer, 'POST', correlationId)
      })
    return defer.promise
  }

  var setEnabled = function (accountID, enabled) {
    var defer = q.defer()
    logger.debug('model', connectorUrl(accountID), {'op': 'replace', 'path': 'enabled', 'value': enabled})
    var startTime = new Date()
    var patch = {'op': 'replace', 'path': 'enabled', 'value': enabled}

    connectorClient().updateNotificationEmailEnabled({
      payload: patch,
      correlationId: correlationId,
      gatewayAccountId: accountID
    }, function (data, response) {
      logger.info(`[${correlationId}] - PATCH to %s ended - elapsed time: %s ms`, connectorUrl(accountID), new Date() - startTime)
      defer.resolve()
    }).on('connectorError', function (err, connectorResponse) {
      if (connectorResponse) return defer.reject(new Error('PATCH_FAILED'))

      logger.info(`[${correlationId}] - PATCH to %s ended - elapsed time: %s ms`, connectorUrl(accountID), new Date() - startTime)
      clientUnavailable(err, defer, 'PATCH', correlationId)
    })
    return defer.promise
  }

  var clientUnavailable = function (error, defer, methodType, correlationId) {
    logger.error(`[${correlationId}] Calling connector to email notification for an account threw exception -`, {
      service: 'connector',
      method: methodType,
      error: error
    })
    defer.reject(new Error('CLIENT_UNAVAILABLE'), error)
  }

  return {
    get: get,
    update: update,
    setEnabled: setEnabled
  }
}
