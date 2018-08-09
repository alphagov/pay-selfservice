'use strict'

const directDebitConnectorClient = require('../../services/clients/direct_debit_connector_client')

const logger = require('winston')

exports.index = (req, res) => {
  if (req.query.state) {
    const getPayload = validateGetRequest(req, res)
    if (getPayload) {
      processPayload(req, res, getPayload)
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

function processPayload (req, res, getPayload) {
  return directDebitConnectorClient.partnerApp.exchangeCode(getPayload)
    .then(response => {
      // todo: show a message to the user
      res.status(200)
      res.end()
    })
    .catch(err => handleBadRequest(res, 'Failed to get the token from Direct Debit Connector', err))
}

function handleBadRequest (res, msg, err) {
  logger.error(`${msg} ${JSON.stringify(err)}`)
  res.status(400)
  res.end()
}
