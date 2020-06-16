'use strict'

const logger = require('../../utils/logger')(__filename)
const { response, renderErrorView } = require('../../utils/response')
const directDebitConnectorClient = require('../../services/clients/direct_debit_connector_client')
const { GO_CARDLESS_ACCOUNT_ALREADY_LINKED_TO_ANOTHER_ACCOUNT } = require('../../models/error-identifier')

exports.index = (req, res) => {
  if (req.query.state) {
    const getPayload = validateGetRequest(req, res)
    if (getPayload) {
      processPayload(req, res, getPayload)
    }
  } else if (req.query.error) {
    handleBadRequest(req, res, 'An error occurred while linking GoCardless account through OAuth', {
      error: req.query.error,
      errorMessage: req.query.error_description
    })
  } else {
    handleBadRequest(req, res, 'Received a BadRequest at GoCardless OAuth endpoint', { query: req.query })
  }
}

function validateGetRequest (req, res) {
  const stateToken = req.query.state
  const gocardlessCode = req.query.code
  if (!stateToken || !gocardlessCode) {
    handleBadRequest(req, res, 'Bad request to /oauth/complete')
  } else {
    return {
      code: gocardlessCode,
      state: stateToken
    }
  }
}

function processPayload (req, res, getPayload) {
  return directDebitConnectorClient.partnerApp.exchangeCode(getPayload)
    .then(result => {
      response(req, res, 'oauth/gocardless_complete')
    })
    .catch(err => {
      console.log(err)
      if (err.errorIdentifier === GO_CARDLESS_ACCOUNT_ALREADY_LINKED_TO_ANOTHER_ACCOUNT) {
        renderErrorView(req, res, 'This GoCardless account is already connected to a GOV.UK Pay account. You’ll need to use a different account.', 400)
      } else {
        handleBadRequest(req, res, 'Failed to get the token from Direct Debit Connector', err)
      }
    })
}

function handleBadRequest (req, res, msg, err) {
  logger.error(`${msg} ${JSON.stringify(err)}`)
  renderErrorView(req, res, false, 400)
}
