'use strict'

const gocardlessClient = require('../../services/clients/gocardless_client')
const directDebitConnectorClient = require('../../services/clients/direct_debit_connector_client')

const logger = require('winston')

const GOCARDLESS_CLIENT_ID = process.env.GOCARDLESS_CLIENT_ID
const GOCARDLESS_CLIENT_SECRET = process.env.GOCARDLESS_CLIENT_SECRET

exports.index = (req, res) => {
  const gatewayAccountId = req.gateway_account.currentGatewayAccountId
  gocardlessClient.redirectToGocardless(
    req,
    res,
    {
      clientId: GOCARDLESS_CLIENT_ID,
      state: 'a-csrf-token' + '.' + gatewayAccountId
    })
}

exports.oauthCompleteGet = (req, res) => {
  if (req.query.state) {
    const getPayload = validateGetRequest(req, res)
    if (getPayload) {
      processPayload(getPayload, res)
    }
  } else if (req.query.error) {
    logger.info('An error occurred while linking GoCardless account through OAuth', {
      error: req.query.error,
      errorMessage: req.query.error_description
    })
    res.status(200)
    res.end()
  } else {
    handleBadRequest(res, 'Received a BadRequest at GoCardless OAuth endpoint', {query: req.query})
  }
}

function validateGetRequest (req, res) {
  const csrfToken = req.query.state.split('.')[0]
  const gatewayAccountId = req.query.state.split('.')[1]
  const correlationId = req.correlationId
  const gocardlessCode = req.query.code
  if (!csrfToken || !gatewayAccountId || !correlationId || !gocardlessCode) {
    handleBadRequest(res, 'Bad request to /oauth/complete')
  } else {
    return {
      csrfToken,
      gatewayAccountId,
      correlationId,
      gocardlessCode
    }
  }
}

function processPayload (getPayload, res) {
  return gocardlessClient.postOAuthToken({
    clientId: GOCARDLESS_CLIENT_ID,
    clientSecret: GOCARDLESS_CLIENT_SECRET,
    code: getPayload.gocardlessCode
  }).then(response => {
    patchGatewayAccount(getPayload.correlationId, getPayload.gatewayAccountId, response, res)
  })
    .catch(err => handleServerError(res, 'Failed to PATCH gateway account ' + getPayload.gatewayAccountId, err))
}

function patchGatewayAccount (correlationId, gatewayAccountId, response, res) {
  return directDebitConnectorClient.gatewayAccount.patch({
    correlationId: correlationId,
    gatewayAccountId: gatewayAccountId,
    access_token: response.access_token,
    organisation_id: response.organisation_id
  }).then(() => {
    res.status(200)
    res.end()
  })
    .catch(err => {
      // todo: add a retry mechanism if this fails
      logger.info('Failed to call PATCH resource' + err)
    })
}

function handleBadRequest (res, msg, err) {
  logger.info(`${msg} ${JSON.stringify(err)}`)
  res.status(400)
  res.end()
}

function handleServerError (res, msg, err) {
  logger.info(`${msg} ${JSON.stringify(err)}`)
  res.status(500)
  res.end()
}
