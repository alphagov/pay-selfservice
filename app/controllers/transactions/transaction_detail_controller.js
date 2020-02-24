'use strict'

// Local Dependencies
const Charge = require('../../models/charge.js')
const auth = require('../../services/auth_service.js')
const { response } = require('../../utils/response.js')
const { renderErrorView } = require('../../utils/response.js')
const { CORRELATION_HEADER } = require('../../utils/correlation_header.js')
const paths = require('../../paths')

const defaultMsg = 'Error processing transaction view'
const notFound = 'Charge not found'

const details = (req, res, returnLink) => {
  const accountId = auth.getCurrentGatewayAccountId(req)
  const chargeId = req.params.chargeId
  const correlationId = req.headers[CORRELATION_HEADER]
  Charge(correlationId)
    .findWithEvents(accountId, chargeId)
    .then(data => {
      data.indexFilters = req.session.filters
      data.returnLink = returnLink
      response(req, res, 'transaction_detail/index', data)
    })
    .catch(err => {
      if (err === 'NOT_FOUND') {
        renderErrorView(req, res, notFound, 404)
      } else {
        renderErrorView(req, res, defaultMsg, 500)
      }
    })
}

const transactionsPage = (req, res) => {
  return details(req, res, paths.transactions.index)
}

const allServiceTransactionsPage = (req, res) => {
  return details(req, res, paths.allServiceTransactions.index)
}

module.exports = {
  transactionsPage,
  allServiceTransactionsPage
}
