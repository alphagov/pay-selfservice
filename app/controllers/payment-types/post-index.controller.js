'use strict'

const lodash = require('lodash')

const paths = require('../../paths')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const { renderErrorView } = require('../../utils/response')
const { ConnectorClient } = require('../../services/clients/connector.client')
const { correlationHeader } = require('../../utils/correlation-header')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)

module.exports = async (req, res) => {
  const correlationId = req.headers[correlationHeader] || ''
  const accountId = req.account.gateway_account_id

  const acceptedDebitCards = typeof req.body.debit === 'string' ? [req.body.debit] : req.body.debit
  const acceptedCreditCards = typeof req.body.credit === 'string' ? [req.body.credit] : req.body.credit

  if (typeof acceptedDebitCards === 'undefined' && typeof acceptedCreditCards === 'undefined') {
    req.flash('genericError', 'You must choose at least one card')
    return res.redirect(
      formatAccountPathsFor(paths.paymentTypes.index, req.account && req.account.external_id)
    )
  }

  const payload = {
    card_types: lodash.union(acceptedDebitCards, acceptedCreditCards)
  }

  try {
    await connector.postAcceptedCardsForAccount(accountId, payload, correlationId)
    req.flash('generic', 'Accepted card types have been updated')
    return res.redirect(
      formatAccountPathsFor(paths.paymentTypes.index, req.account && req.account.external_id)
    )
  } catch (error) {
    return renderErrorView(req, res, 'Unable to update payment types. Please try again or contact support team.', error.errorCode)
  }
}
