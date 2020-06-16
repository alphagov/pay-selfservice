'use strict'

const lodash = require('lodash')

const paths = require('../../paths')
const { renderErrorView } = require('../../utils/response')
const { ConnectorClient } = require('../../services/clients/connector_client')
const { correlationHeader } = require('../../utils/correlation_header')
const auth = require('../../services/auth_service.js')

module.exports = async (req, res) => {
  const connector = new ConnectorClient(process.env.CONNECTOR_URL)
  const correlationId = req.headers[correlationHeader] || ''
  const accountId = auth.getCurrentGatewayAccountId(req)

  const acceptedDebitCards = typeof req.body.debit === 'string' ? [req.body.debit] : req.body.debit
  const acceptedCreditCards = typeof req.body.credit === 'string' ? [req.body.credit] : req.body.credit

  if (typeof acceptedDebitCards === 'undefined' && typeof acceptedCreditCards === 'undefined') {
    req.flash('genericError', 'You must choose at least one card')
    return res.redirect(paths.paymentTypes.index)
  }

  const payload = {
    card_types: lodash.union(acceptedDebitCards, acceptedCreditCards)
  }

  try {
    await connector.postAcceptedCardsForAccount(accountId, payload, correlationId)
    req.flash('generic', 'Accepted card types have been updated')
    return res.redirect(paths.paymentTypes.index)
  } catch (error) {
    return renderErrorView(req, res, error.message.message[0], error.errorCode)
  }
}
