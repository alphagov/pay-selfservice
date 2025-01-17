const cardsThatNeedToBeEnabledOnWorldpay = ['American Express', 'Union Pay']

const formatLabel = (card) => {
  if (card.brand === 'visa' || card.brand === 'master-card') {
    return `${card.label} ${card.type.toLowerCase()}`
  }
  return card.brand === 'jcb' ? card.label.toUpperCase() : card.label
}

const createCardTypeChecklistItem = (card, acceptedCards) => {
  return {
    value: card.id,
    text: formatLabel(card),
    checked: acceptedCards.filter(accepted => accepted.id === card.id).length !== 0,
    requires3ds: card.requires3ds
  }
}

const disableCheckboxIf3dsRequiredButNotEnabled = (cardTypeChecklistItem, account) => {
  if (cardTypeChecklistItem.requires3ds && !account.requires3ds) {
    return {
      ...cardTypeChecklistItem,
      disabled: true,
      hint: {
        html: account.paymentProvider === 'sandbox' ? `${cardTypeChecklistItem.text} is not available on sandbox test accounts` : `${cardTypeChecklistItem.text} cannot be used because 3D Secure is switched off for this service`
      }
    }
  }
  return cardTypeChecklistItem
}

const addHintForAmexAndUnionpayIfWorldpay = (cardTypeChecklistItem, paymentProvider) => {
  if (cardsThatNeedToBeEnabledOnWorldpay.includes(cardTypeChecklistItem.text) && paymentProvider === 'worldpay') {
    return {
      ...cardTypeChecklistItem,
      hint: {
        html: 'You must have already enabled this with Worldpay'
      }
    }
  }
  return cardTypeChecklistItem
}

const formatCardTypesForAdminTemplate = (allCards, acceptedCards, account) => {
  const debitCardChecklistItems = allCards.filter(card => card.type === 'DEBIT')
    .map(card => createCardTypeChecklistItem(card, acceptedCards))
    .map(cardTypeChecklistItem => disableCheckboxIf3dsRequiredButNotEnabled(cardTypeChecklistItem, account))

  const creditCardChecklistItems = allCards.filter(card => card.type === 'CREDIT')
    .map(card => createCardTypeChecklistItem(card, acceptedCards))
    .map(cardTypeChecklistItem => addHintForAmexAndUnionpayIfWorldpay(cardTypeChecklistItem, account.paymentProvider))

  return { debitCards: debitCardChecklistItems, creditCards: creditCardChecklistItems }
}

const formatCardTypesForNonAdminTemplate = (allCards, acceptedCards) => {
  const acceptedCardTypeIds = acceptedCards.map(card => card.id)
  const formattedCardTypes = {
    'debit/enabled': {
      cards: [],
      heading: 'Enabled debit cards'
    },
    'debit/disabled': {
      cards: [],
      heading: 'Not enabled debit cards'
    },
    'credit/enabled': {
      cards: [],
      heading: 'Enabled credit cards'
    },
    'credit/disabled': {
      cards: [],
      heading: 'Not enabled credit cards'
    }
  }
  allCards.forEach(card => {
    const cardIsEnabled = acceptedCardTypeIds.includes(card.id) ? 'enabled' : 'disabled'
    formattedCardTypes[`${card.type.toLowerCase()}/${cardIsEnabled}`].cards.push(formatLabel(card))
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
