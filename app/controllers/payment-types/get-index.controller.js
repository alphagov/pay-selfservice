'use strict'

const { response, renderErrorView } = require('../../utils/response')
const { ConnectorClient } = require('../../services/clients/connector.client')
const { correlationHeader } = require('../../utils/correlation-header')
const auth = require('../../services/auth.service')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)

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
          html: `You must <a class="govuk-link" href="/3ds">enable 3D Secure</a> to accept ${card.label}`
        }
      }
      return formatted
    })

  const creditCards = allCards.filter(card => card.type === 'CREDIT')
    .map(card => {
      const formatted = formatCardInfoForNunjucks(card)
      if (['american-express', 'unionpay'].includes(card.brand)) {
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
  const correlationId = req.headers[correlationHeader] || ''
  const accountId = auth.getCurrentGatewayAccountId(req)

  try {
    const { card_types: allCards } = await connector.getAllCardTypes(correlationId)
    const { card_types: acceptedCards } = await connector.getAcceptedCardsForAccountPromise(accountId, correlationId)

    response(req, res, 'payment-types/card-types', formatCardsForTemplate(allCards, acceptedCards, req.account.requires3ds))
  } catch (error) {
    renderErrorView(req, res, 'Unable to fetch payment types. Please try again or contact support team.', error.errorCode)
  }
}
