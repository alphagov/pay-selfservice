'use strict'

const paths = require('../../paths')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const { ConnectorClient } = require('../../services/clients/connector.client')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)

module.exports = async function updateCardTypes (req, res, next) {
  const accountId = req.account.gateway_account_id

  const acceptedDebitCards = (typeof req.body.debit === 'string' ? [req.body.debit] : req.body.debit) || []
  const acceptedCreditCards = (typeof req.body.credit === 'string' ? [req.body.credit] : req.body.credit) || []

  if (!acceptedDebitCards.length && !acceptedCreditCards.length) {
    req.flash('genericError', 'You must choose at least one card')
    return res.redirect(
      formatAccountPathsFor(paths.account.paymentTypes.index, req.account && req.account.external_id)
    )
  }

  const payload = {
    card_types: [...new Set([...acceptedDebitCards, ...acceptedCreditCards])]
  }

  try {
    await connector.postAcceptedCardsForAccount(accountId, payload)
    req.flash('generic', 'Accepted card types have been updated')
    return res.redirect(
      formatAccountPathsFor(paths.account.paymentTypes.index, req.account && req.account.external_id)
    )
  } catch (err) {
    next(err)
  }
}
