'use strict'

const gocardlessClient = require('../../services/clients/gocardless_client')
const directDebitConnectorClient = require('../../services/clients/direct_debit_connector_client')
const REDIRECT_URI = process.env.SELFSERVICE_BASE + '/oauth/complete'

const logger = require('winston')

exports.index = (req, res) => {
  const gatewayAccountId = req.account.externalId

  directDebitConnectorClient.partnerApp.createState({gatewayAccountId, redirectUri: REDIRECT_URI})
    .then(response => {
      redirectToGoCardlessConnect(req, res, response.token)
    })
    .catch(err => {
      handleServerError(res, 'There was an error getting a state token from Direct Debit Connector', err)
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

function redirectToGoCardlessConnect (req, res, stateToken) {
  gocardlessClient.redirectToGocardless(
    req,
    res,
    {
      gocardlessOauthUrl: getGoCardlessOAuthUrl(req.account),
      clientId: getGoCardlessOAuthClientId(req.account),
      state: stateToken
    })
}

function validateGetRequest (req, res) {
  const stateToken = req.query.state
  const gocardlessCode = req.query.code
  if (!stateToken || !gocardlessCode) {
    handleBadRequest(res, 'Bad request to /oauth/complete')
  } else {
    return {
      code: gocardlessCode,
      state: stateToken
    }
  }
}

function processPayload (getPayload, res) {
  return directDebitConnectorClient.partnerApp.exchangeAccessCode(getPayload)
    .then(response => {
      // todo: show a message to the user
    })
    .catch(err => handleServerError(res, 'Failed to get the token from Direct Debit Connector', err))
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

function getGoCardlessOAuthUrl (gatewayAccount) {
  return (gatewayAccount.type === 'test') ? process.env.GOCARDLESS_TEST_OAUTH_BASE_URL : process.env.GOCARDLESS_LIVE_OAUTH_BASE_URL
}

function getGoCardlessOAuthClientId (gatewayAccount) {
  return (gatewayAccount.type === 'test') ? process.env.GOCARDLESS_TEST_CLIENT_ID : process.env.GOCARDLESS_LIVE_CLIENT_ID
}
