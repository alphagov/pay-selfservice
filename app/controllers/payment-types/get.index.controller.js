'use strict'

// Local dependencies
const { response, renderErrorView } = require('../../utils/response')
const { ConnectorClient } = require('../../services/clients/connector_client')
const { correlationHeader } = require('../../utils/correlation_header')
const auth = require('../../services/auth_service')

function formatLabel (card) {
  if (card.brand === 'visa' || card.brand === 'master-card') {
    return `${card.label} ${card.type.toLowerCase()}`
  } else {
    return card.brand === 'jcb' ? card.label.toUpperCase() : card.label
  }
}

function formatCardsForTemplate (allCards, acceptedCards, threeDSEnabled) {
  const formatCardInfoForNunjucks = card => {
    return {
      value: card.id,
      text: formatLabel(card),
      checked: acceptedCards.filter(accepted => accepted.id === card.id).length !== 0
    }
  }

  const debitCards = allCards.filter(card => card.type === 'DEBIT')
    .map(card => {
      const formatted = formatCardInfoForNunjucks(card)

      if (card.requires3ds && !threeDSEnabled) {
        formatted.disabled = true
        formatted.hint = {
          html: `You must <a class="govuk-link" href="/3ds">enable 3D Secure</a> to accept Maestro`
        }
      }
      return formatted
    })

  const creditCards = allCards.filter(card => card.type === 'CREDIT')
    .map(card => {
      const formatted = formatCardInfoForNunjucks(card)
      if (card.brand === 'american-express') {
        formatted.hint = {
          html: `You must have already enabled this with your PSP`
        }
      }
      return formatted
    })

  return {
    debitCards,
    creditCards
  }
}

module.exports = async (req, res) => {
  const connector = new ConnectorClient(process.env.CONNECTOR_URL)
  const correlationId = req.headers[correlationHeader] || ''
  const accountId = auth.getCurrentGatewayAccountId(req)

  try {
    const { card_types: allCards } = await connector.getAllCardTypesPromise(correlationId)
    const { card_types: acceptedCards } = await connector.getAcceptedCardsForAccountPromise(accountId, correlationId)

    response(req, res, 'payment-types/card-types', formatCardsForTemplate(allCards, acceptedCards, req.account.requires3ds))
  } catch (error) {
    renderErrorView(req, res, error.message.message[0], error.errorCode)
  }
}
