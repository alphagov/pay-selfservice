'use strict'

const response = require('../../utils/response.js').response
const renderErrorView = require('../../utils/response.js').renderErrorView
const auth = require('../../services/auth_service.js')
const Charge = require('../../models/charge.js')
const CORRELATION_HEADER = require('../../utils/correlation_header.js').CORRELATION_HEADER

module.exports = (req, res) => {
  const accountId = auth.getCurrentGatewayAccountId(req)
  const chargeId = req.params.chargeId
  const correlationId = req.headers[CORRELATION_HEADER]
  const defaultMsg = 'Error processing transaction view'
  const notFound = 'Charge not found'

  Charge(correlationId)
    .findWithEvents(accountId, chargeId)
    .then(data => {
      data.indexFilters = req.session.filters
      response(req, res, 'transaction_detail/index', data)
    })
    .catch(err => {
      renderErrorView(req, res, err === 'NOT_FOUND' ? notFound : defaultMsg)
    })
}
