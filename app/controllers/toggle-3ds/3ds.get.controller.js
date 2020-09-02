'use strict'

const lodash = require('lodash')

const { response, renderErrorView } = require('../../utils/response')
const { ConnectorClient } = require('../../services/clients/connector.client')
const { correlationHeader } = require('../../utils/correlation-header')

module.exports = async (req, res) => {
  const connector = new ConnectorClient(process.env.CONNECTOR_URL)
  const correlationId = req.headers[correlationHeader] || ''
  const accountId = req.account.gateway_account_id

  try {
    const { card_types: acceptedCards } = await connector.getAcceptedCardsForAccountPromise(accountId, correlationId)

    const pageData = {
      disabled3ds: req.account.disableToggle3ds,
      supports3ds: req.account.supports3ds,
      requires3ds: req.account.requires3ds,
      hasCardTypeRequiring3dsEnabled: lodash.some(acceptedCards, 'requires3ds'),
      showHelper3ds: req.account.payment_provider === 'worldpay'
    }

    return response(req, res, 'toggle-3ds/index', pageData)
  } catch (error) {
    return renderErrorView(req, res, false, error.errorCode)
  }
}
