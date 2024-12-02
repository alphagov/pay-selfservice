const formatLabel = (card) => {
  if (card.brand === 'visa' || card.brand === 'master-card') {
    return `${card.label} ${card.type.toLowerCase()}`
  } else {
    return card.brand === 'jcb' ? card.label.toUpperCase() : card.label
  }
}

const formatCardTypesForAdminTemplate = (allCards, acceptedCards, account) => {
  const cardDataChecklistItem = (card) => {
    return {
      value: card.id,
      text: formatLabel(card),
      checked: acceptedCards.filter(accepted => accepted.id === card.id).length !== 0,
      requires3ds: card.requires3ds
    }
  }
  const disableCheckboxIf3dsRequiredButNotEnabled = (cardTypeChecklistItem) => {
    if (cardTypeChecklistItem.requires3ds && !account.requires3ds) {
      cardTypeChecklistItem.disabled = true
      cardTypeChecklistItem.hint = {
        html: account.type === 'test' ? `${cardTypeChecklistItem.text} is not available on test accounts` : `${cardTypeChecklistItem.text} cannot be used because 3D Secure is not available. Please contact support`
      }
    }
    return cardTypeChecklistItem
  }
  const addHintForAmexAndUnionpay = (cardTypeChecklistItem) => {
    if (['American Express', 'Union Pay'].includes(cardTypeChecklistItem.text)) {
      if (account.paymentProvider === 'worldpay') {
        cardTypeChecklistItem.hint = {
          html: 'You must have already enabled this with Worldpay'
        }
      }
    }
    return cardTypeChecklistItem
  }
  const debitCardChecklistItems = allCards.filter(card => card.type === 'DEBIT')
    .map(card => cardDataChecklistItem(card))
    .map(cardTypeChecklistItem => disableCheckboxIf3dsRequiredButNotEnabled(cardTypeChecklistItem))

  const creditCardChecklistItems = allCards.filter(card => card.type === 'CREDIT')
    .map(card => cardDataChecklistItem(card))
    .map(cardTypeChecklistItem => addHintForAmexAndUnionpay(cardTypeChecklistItem))

  return { debitCards: debitCardChecklistItems, creditCards: creditCardChecklistItems }
}

const formatCardTypesForNonAdminTemplate = (allCards, acceptedCards) => {
  const acceptedCardTypeIds = acceptedCards.map(card => card.id)
  const formattedCardTypes = {
    'Enabled debit cards': [],
    'Not enabled debit cards': [],
    'Enabled credit cards': [],
    'Not enabled credit cards': []
  }
  allCards.forEach(card => {
    const cardIsEnabled = acceptedCardTypeIds.includes(card.id) ? 'Enabled' : 'Not enabled'
    formattedCardTypes[`${cardIsEnabled} ${card.type.toLowerCase()} cards`].push(formatLabel(card))
  })
  return formattedCardTypes
}

const formatCardTypesForTemplate = (allCards, acceptedCards, account, isAdminUser) => {
  if (isAdminUser) {
    return formatCardTypesForAdminTemplate(allCards, acceptedCards, account)
  }
  return formatCardTypesForNonAdminTemplate(allCards, acceptedCards)
}

module.exports = {
  formatCardTypesForTemplate
}
