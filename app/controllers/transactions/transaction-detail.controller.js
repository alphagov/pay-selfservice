'use strict'

const { ledgerFindWithEvents } = require('../../services/transaction.service')
const auth = require('../../services/auth.service.js')
const { response } = require('../../utils/response.js')
const { renderErrorView } = require('../../utils/response.js')

const defaultMsg = 'Error processing transaction view'
const notFound = 'Charge not found'

module.exports = (req, res) => {
  const accountId = auth.getCurrentGatewayAccountId(req)
  const chargeId = req.params.chargeId

  ledgerFindWithEvents(accountId, chargeId, req.correlationId)
    .then(data => {
      data.indexFilters = req.session.filters
      if (req.session.backLink) {
        data.redirectBackLink = req.session.backLink
        delete req.session.backLink
      }
      data.service = req.service
      response(req, res, 'transaction-detail/index', data)
    })
    .catch(err => {
      if (err === 'NOT_FOUND') {
        renderErrorView(req, res, notFound, 404)
      } else {
        renderErrorView(req, res, defaultMsg, 500)
      }
    })
}
