const _ = require('lodash')
const paths = require('../paths')
const formatAccountPathsFor = require('../utils/format-account-paths-for')
const { response } = require('../utils/response')
const { getCredentialByExternalId } = require('../utils/credentials')
const { ConnectorClient } = require('../services/clients/connector.client')
const { CONNECTOR_URL } = process.env
const { CORRELATION_HEADER } = require('../utils/correlation-header')
const { isPasswordLessThanTenChars } = require('../browsered/field-validation-checks')
const { NotFoundError } = require('../errors')

const connectorClient = new ConnectorClient(CONNECTOR_URL)

function credentialsPatchRequestValueOf (reqBody) {
  let requestPayload = {
    credentials: {
      username: reqBody.username && reqBody.username.trim(),
      password: reqBody.password && reqBody.password.trim()
    }
  }

  if (reqBody.merchantId) {
    requestPayload.credentials.merchant_id = reqBody.merchantId.trim()
  }
  if (reqBody.shaInPassphrase) {
    requestPayload.credentials.sha_in_passphrase = reqBody.shaInPassphrase.trim()
  }
  if (reqBody.shaOutPassphrase) {
    requestPayload.credentials.sha_out_passphrase = reqBody.shaOutPassphrase.trim()
  }

  return requestPayload
}

function editCredentials (req, res, next) {
  if (req.account.payment_provider === 'stripe') {
    return next(new NotFoundError('Attempted to access credentials page for a Stripe account'))
  }

  try {
    const { credentialId } = req.params
    const credential = getCredentialByExternalId(req.account, credentialId)

    response(req, res, 'credentials/' + credential.payment_provider, {
      credential
    })
  } catch (error) {
    next(error)
  }
}

async function update (req, res, next) {
  const accountId = req.account.gateway_account_id
  const correlationId = req.headers[CORRELATION_HEADER] || ''

  try {
    const credential = getCredentialByExternalId(req.account, req.params.credentialId)
    await connectorClient.patchAccountGatewayAccountCredentials({
      correlationId,
      gatewayAccountId: accountId,
      gatewayAccountCredentialsId: credential.gateway_account_credential_id,
      userExternalId: req.user.externalId,
      ...credentialsPatchRequestValueOf(req.body)
    })

    return res.redirect(303, formatAccountPathsFor(paths.account.yourPsp.index, req.account.external_id, credential.external_id))
  } catch (err) {
    next(err)
  }
}

function editNotificationCredentials (req, res, next) {
  if (req.account.payment_provider !== 'smartpay') {
    return next(new NotFoundError('Attempted to access notification credentials page for a non-Smartpay account'))
  }

  try {
    const { credentialId } = req.params
    const credential = getCredentialByExternalId(req.account, credentialId)

    const pageData = {
      credential,
    }
    const invalidCreds = _.get(req, 'session.pageData.editNotificationCredentials')
    if (invalidCreds) {
      pageData.lastNotificationsData = invalidCreds
      delete req.session.pageData.editNotificationCredentials
    }

    response(req, res, 'credentials/smartpay-notification-credentials', pageData)
  } catch (error) {
    next(error)
  }
}

async function updateNotificationCredentials (req, res, next) {
  const accountId = req.account.gateway_account_id
  const username = req.body.username && req.body.username.trim()
  const password = req.body.password && req.body.password.trim()

  if (!username) {
    req.flash('genericError', 'Enter a username')
  } else if (!password) {
    req.flash('genericError', 'Enter a password')
  } else {
    const failedValidationMessage = isPasswordLessThanTenChars(password)
    if (failedValidationMessage) {
      req.flash('genericError', failedValidationMessage)
    }
  }

  try {
    const credential = getCredentialByExternalId(req.account, req.params.credentialId)
    if (_.get(req, 'session.flash.genericError.length')) {
      _.set(req, 'session.pageData.editNotificationCredentials', { username, password })
      return res.redirect(formatAccountPathsFor(paths.account.notificationCredentials.edit, req.account.external_id, credential.external_id))
    }

    const correlationId = req.headers[CORRELATION_HEADER] || ''

    await connectorClient.postAccountNotificationCredentials({
      payload: { username, password },
      correlationId: correlationId,
      gatewayAccountId: accountId
    })

    return res.redirect(303, formatAccountPathsFor(paths.account.yourPsp.index, req.account.external_id, credential.external_id))
  } catch (err) {
    next(err)
  }
}

module.exports = {
  editCredentials,
  update,
  editNotificationCredentials,
  updateNotificationCredentials
}
