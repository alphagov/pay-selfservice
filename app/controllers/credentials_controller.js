const EDIT_CREDENTIALS_MODE = 'editCredentials'
const EDIT_NOTIFICATION_CREDENTIALS_MODE = 'editNotificationCredentials'

var logger = require('winston')
var _ = require('lodash')
const paths = require('../paths')
var response = require('../utils/response.js').response
var errorView = require('../utils/response.js').renderErrorView
var ConnectorClient = require('../services/clients/connector_client').ConnectorClient
var auth = require('../services/auth_service.js')
var router = require('../routes.js')
const {CONNECTOR_URL} = process.env
var CORRELATION_HEADER = require('../utils/correlation_header.js').CORRELATION_HEADER
const {utils} = require('@govuk-pay/pay-js-commons')

var connectorClient = () => new ConnectorClient(CONNECTOR_URL)

function showSuccessView (viewMode, req, res) {
  let responsePayload = {}

  switch (viewMode) {
    case EDIT_CREDENTIALS_MODE:
      responsePayload.editMode = true
      responsePayload.editNotificationCredentialsMode = false
      break
    case EDIT_NOTIFICATION_CREDENTIALS_MODE:
      responsePayload.editMode = false
      responsePayload.editNotificationCredentialsMode = true
      break
    default:
      responsePayload.editMode = false
      responsePayload.editNotificationCredentialsMode = false
  }
  const invalidCreds = _.get(req, 'session.pageData.editNotificationCredentials')
  if (invalidCreds) {
    responsePayload.lastNotificationsData = invalidCreds
    delete req.session.pageData.editNotificationCredentials
  }
  response(req, res, 'provider_credentials/' + req.account.payment_provider, responsePayload)
}

function loadIndex (req, res, viewMode) {
  if (req.account) {
    showSuccessView(viewMode, req, res)
  } else {
    errorView(req, res)
  }
}

function credentialsPatchRequestValueOf (req) {
  let requestPayload = {
    credentials: {
      username: req.body.username,
      password: req.body.password
    }
  }

  const merchantId = _.get(req, 'body.merchantId')
  if (merchantId) {
    requestPayload.credentials.merchant_id = req.body.merchantId
  }

  const shaInPassphrase = _.get(req, 'body.shaInPassphrase')
  if (shaInPassphrase) {
    requestPayload.credentials.sha_in_passphrase = req.body.shaInPassphrase
  }

  const shaOutPassphrase = _.get(req, 'body.shaOutPassphrase')
  if (shaOutPassphrase) {
    requestPayload.credentials.sha_out_passphrase = req.body.shaOutPassphrase
  }

  return requestPayload
}

module.exports = {
  index: function (req, res) {
    loadIndex(req, res)
  },

  editCredentials: function (req, res) {
    loadIndex(req, res, EDIT_CREDENTIALS_MODE)
  },

  editNotificationCredentials: function (req, res) {
    loadIndex(req, res, EDIT_NOTIFICATION_CREDENTIALS_MODE)
  },

  updateNotificationCredentials: function (req, res) {
    const accountId = auth.getCurrentGatewayAccountId((req))
    const connectorUrl = CONNECTOR_URL + '/v1/api/accounts/{accountId}/notification-credentials'
    const {username, password} = _.get(req, 'body')

    if (!username) {
      req.flash('genericError', `<h2>Please enter a valid username</h2>`)
    } else if (!password) {
      req.flash('genericError', `<h2>Please enter a valid password</h2>`)
    } else if (utils.fieldValidationChecks.isPasswordLessThanTenChars(password)) {
      req.flash('genericError', `<h2>Please enter a valid password</h2> ${utils.fieldValidationChecks.isPasswordLessThanTenChars(password)}`)
    }

    if (_.get(req, 'session.flash.genericError.length')) {
      _.set(req, 'session.pageData.editNotificationCredentials', {username, password})
      return res.redirect(paths.notificationCredentials.edit)
    }

    logger.info('Calling connector to update provider notification credentials -', {
      service: 'connector',
      method: 'POST',
      url: '/frontend/accounts/{id}/notification-credentials'
    })

    var startTime = new Date()
    var url = connectorUrl.replace('{accountId}', accountId)
    var correlationId = req.headers[CORRELATION_HEADER] || ''

    connectorClient().postAccountNotificationCredentials({
      payload: {username, password},
      correlationId: correlationId,
      gatewayAccountId: accountId
    }, function (connectorData, connectorResponse) {
      var duration = new Date() - startTime
      logger.info(`[${correlationId}] - POST to ${url} ended - elapsed time: ${duration} ms`)
      res.redirect(303, router.paths.credentials.index)
    }).on('connectorError', function (err, connectorResponse) {
      var duration = new Date() - startTime
      logger.info(`[${correlationId}] - POST to ${url} ended - elapsed time: ${duration} ms`)
      if (connectorResponse && connectorResponse.statusCode) {
        logger.error(`[${correlationId}] Calling connector to update provider notification credentials failed -`, {
          service: 'connector',
          method: 'POST',
          url: connectorUrl,
          status: connectorResponse.statusCode
        })
      } else {
        logger.error(`[${correlationId}] Calling connector to update provider notification credentials threw exception  -`, {
          service: 'connector',
          method: 'POST',
          url: connectorUrl,
          error: err
        })
      }

      errorView(req, res)
    })
  },

  update: function (req, res) {
    logger.debug('Calling connector to update provider credentials -', {
      service: 'connector',
      method: 'PATCH',
      url: '/frontend/accounts/{id}/credentials'
    })
    var accountId = auth.getCurrentGatewayAccountId(req)
    var connectorUrl = CONNECTOR_URL + '/v1/frontend/accounts/{accountId}/credentials'

    logger.info('Calling connector to update provider credentials -', {
      service: 'connector',
      method: 'PATCH',
      url: '/frontend/accounts/{id}/credentials'
    })
    var url = connectorUrl.replace('{accountId}', accountId)
    var correlationId = req.headers[CORRELATION_HEADER] || ''

    var startTime = new Date()
    connectorClient().patchAccountCredentials({
      payload: credentialsPatchRequestValueOf(req),
      correlationId: correlationId,
      gatewayAccountId: accountId
    }, function (connectorData, connectorResponse) {
      var duration = new Date() - startTime
      logger.info(`[${correlationId}] - PATCH to ${url} ended - elapsed time: ${duration} ms`)
      res.redirect(303, router.paths.credentials.index)
    }).on('connectorError', function (err, connectorResponse) {
      var duration = new Date() - startTime
      logger.info(`[${correlationId}] - PATCH to ${url} ended - elapsed time: ${duration} ms`)

      if (connectorResponse && connectorResponse.statusCode) {
        logger.error(`[${correlationId}] Calling connector to update provider credentials failed. Redirecting back to credentials view -`, {
          service: 'connector',
          method: 'PATCH',
          url: connectorUrl,
          status: connectorResponse.statusCode
        })
      } else {
        logger.error(`[${correlationId}] Calling connector to update provider credentials threw exception  -`, {
          service: 'connector',
          method: 'PATCH',
          url: connectorUrl,
          error: err
        })
      }
      errorView(req, res)
    })
  }
}
