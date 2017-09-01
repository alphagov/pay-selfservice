'use strict'

// Local Dependencies
const Charge = require('../../models/charge.js')
const auth = require('../../services/auth_service.js')
const {response} = require('../../utils/response.js')
const {renderErrorView} = require('../../utils/response.js')
const {CORRELATION_HEADER} = require('../../utils/correlation_header.js')

const defaultMsg = 'Error processing transaction view'
const notFound = 'Charge not found'

module.exports = (req, res) => {
  const accountId = auth.getCurrentGatewayAccountId(req)
  const chargeId = req.params.chargeId
  const correlationId = req.headers[CORRELATION_HEADER]

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
