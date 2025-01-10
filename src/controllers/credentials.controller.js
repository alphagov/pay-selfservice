const _ = require('lodash')
const paths = require('../paths')
const formatAccountPathsFor = require('../utils/format-account-paths-for')
const { response } = require('../utils/response')
const { getCredentialByExternalId } = require('../utils/credentials')
const { ConnectorClient } = require('../services/clients/connector.client')
const { CONNECTOR_URL } = process.env
const { isPasswordLessThanTenChars } = require('../utils/validation/field-validation-checks')
const { NotFoundError } = require('../errors')

const connectorClient = new ConnectorClient(CONNECTOR_URL)

function credentialsPatchRequestValueOf (reqBody) {
  const requestPayload = {
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

    const recovered = req.session.recovered || {}
    delete req.session.recovered

    response(req, res, 'credentials/' + credential.payment_provider, {
      credential,
      errors: recovered.errors,
      merchantId: recovered.merchantId || credential.credentials.merchant_id || '',
      username: recovered.username || credential.credentials.username || '',
      password: recovered.password || '',
      shaInPassphrase: recovered.shaInPassphrase || '',
      shaOutPassphrase: recovered.shaOutPassphrase || ''
    })
  } catch (error) {
    next(error)
  }
}

async function update (req, res, next) {
  const accountId = req.account.gateway_account_id

  try {
    const credential = getCredentialByExternalId(req.account, req.params.credentialId)
    const { username, password, merchantId, shaInPassphrase, shaOutPassphrase } = req.body

    const errors = {}
    if (!merchantId) {
      errors.merchantId = credential.payment_provider === 'epdq' ? 'Enter your PSP ID' : 'Enter your merchant account code'
    }
    if (!username) {
      errors.username = 'Enter your username'
    }
    if (!password) {
      errors.password = 'Enter your password' // pragma: allowlist secret
    }

    if (credential.payment_provider === 'epdq') {
      if (!shaInPassphrase) {
        errors.shaInPassphrase = 'Enter your SHA-IN passphrase'
      }
      if (!shaOutPassphrase) {
        errors.shaOutPassphrase = 'Enter your SHA-OUT passphrase'
      }
    }

    if (!_.isEmpty(errors)) {
      req.session.recovered = {
        errors,
        merchantId,
        username,
        password,
        shaInPassphrase,
        shaOutPassphrase
      }
      return res.redirect(303, formatAccountPathsFor(paths.account.credentials.edit, req.account.external_id, credential.external_id))
    }

    await connectorClient.patchAccountGatewayAccountCredentials({
      gatewayAccountId: accountId,
      gatewayAccountCredentialsId: credential.gateway_account_credential_id,
      userExternalId: req.user.externalId,
      path: 'credentials',
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

    const recovered = req.session.recovered || {}
    delete req.session.recovered
    const pageData = {
      credential
    }
    const invalidCreds = _.get(req, 'session.pageData.editNotificationCredentials')
    if (invalidCreds) {
      pageData.lastNotificationsData = invalidCreds
      delete req.session.pageData.editNotificationCredentials
    }

    response(req, res, 'credentials/smartpay-notification-credentials', {
      credential,
      errors: recovered.errors,
      username: recovered.username || (req.account.notificationCredentials && req.account.notificationCredentials.userName) || '',
      password: recovered.password || ''
    })
  } catch (error) {
    next(error)
  }
}

async function updateNotificationCredentials (req, res, next) {
  const accountId = req.account.gateway_account_id
  const username = req.body.username && req.body.username.trim()
  const password = req.body.password && req.body.password.trim()

  try {
    const credential = getCredentialByExternalId(req.account, req.params.credentialId)

    const errors = {}
    if (!username) {
      errors.username = 'Enter your username'
    }
    if (!password) {
      errors.password = 'Enter your password' // pragma: allowlist secret
    } else {
      const failedValidationMessage = isPasswordLessThanTenChars(password)
      if (failedValidationMessage) {
        errors.password = failedValidationMessage
      }
    }

    if (!_.isEmpty(errors)) {
      req.session.recovered = {
        errors,
        username,
        password
      }
      return res.redirect(formatAccountPathsFor(paths.account.notificationCredentials.edit, req.account.external_id, credential.external_id))
    }

    await connectorClient.postAccountNotificationCredentials({
      payload: { username, password },
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
