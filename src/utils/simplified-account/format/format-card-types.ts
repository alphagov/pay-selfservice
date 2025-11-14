import { CardType } from '@models/card-type/CardType.class'
import GatewayAccount from '@models/gateway-account/GatewayAccount.class'

const cardsThatNeedToBeEnabledOnWorldpay = ['American Express', 'Union Pay']

const formatLabel = (card: CardType) => {
  if (card.brand === 'visa' || card.brand === 'master-card') {
    return `${card.label} ${card.type.toLowerCase()}`
  }
  return card.brand === 'jcb' ? card.label.toUpperCase() : card.label
}

interface CardTypeChecklistItem {
  value: string
  text: string
  checked: boolean
  requires3ds: boolean
  disabled?: boolean
  hint?: {
    html: string
  }
}

const createCardTypeChecklistItem = (card: CardType, acceptedCards: CardType[]): CardTypeChecklistItem => {
  return {
    value: card.id,
    text: formatLabel(card),
    checked: acceptedCards.filter((accepted) => accepted.id === card.id).length !== 0,
    requires3ds: card.requires3ds,
  }
}

const disableCheckboxIf3dsRequiredButNotEnabled = (
  cardTypeChecklistItem: CardTypeChecklistItem,
  account: GatewayAccount
): CardTypeChecklistItem => {
  if (cardTypeChecklistItem.requires3ds && !account.requires3ds) {
    return {
      ...cardTypeChecklistItem,
      disabled: true,
      hint: {
        html:
          account.paymentProvider === 'sandbox'
            ? `${cardTypeChecklistItem.text} is not available on sandbox test accounts`
            : `${cardTypeChecklistItem.text} cannot be used because 3D Secure is switched off for this service`,
      },
    }
  }
  return cardTypeChecklistItem
}

const addHintForAmexAndUnionpayIfWorldpay = (cardTypeChecklistItem: CardTypeChecklistItem, paymentProvider: string) => {
  if (cardsThatNeedToBeEnabledOnWorldpay.includes(cardTypeChecklistItem.text) && paymentProvider === 'worldpay') {
    return {
      ...cardTypeChecklistItem,
      hint: {
        html: 'You must have already enabled this with Worldpay',
      },
    }
  }
  return cardTypeChecklistItem
}

interface FormattedAdminCardTypes {
  debitCards: CardTypeChecklistItem[]
  creditCards: CardTypeChecklistItem[]
}

const formatCardTypesForAdminTemplate = (
  allCards: CardType[],
  acceptedCards: CardType[],
  account: GatewayAccount
): FormattedAdminCardTypes => {
  const debitCardChecklistItems = allCards
    .filter((card) => card.type === 'DEBIT')
    .map((card) => createCardTypeChecklistItem(card, acceptedCards))
    .map((cardTypeChecklistItem) => disableCheckboxIf3dsRequiredButNotEnabled(cardTypeChecklistItem, account))

  const creditCardChecklistItems = allCards
    .filter((card) => card.type === 'CREDIT')
    .map((card) => createCardTypeChecklistItem(card, acceptedCards))
    .map((cardTypeChecklistItem) => addHintForAmexAndUnionpayIfWorldpay(cardTypeChecklistItem, account.paymentProvider))

  return { debitCards: debitCardChecklistItems, creditCards: creditCardChecklistItems }
}

type FormattedNonAdminCardTypes = Record<string, { cards: string[]; heading: string }>

const formatCardTypesForNonAdminTemplate = (
  allCards: CardType[],
  acceptedCards: CardType[]
): FormattedNonAdminCardTypes => {
  const acceptedCardTypeIds = acceptedCards.map((card) => card.id)
  const formattedCardTypes: FormattedNonAdminCardTypes = {
    'debit/enabled': {
      cards: [],
      heading: 'Enabled debit cards',
    },
    'debit/disabled': {
      cards: [],
      heading: 'Not enabled debit cards',
    },
    'credit/enabled': {
      cards: [],
      heading: 'Enabled credit cards',
    },
    'credit/disabled': {
      cards: [],
      heading: 'Not enabled credit cards',
    },
  }
  allCards.forEach((card) => {
    const cardIsEnabled = acceptedCardTypeIds.includes(card.id) ? 'enabled' : 'disabled'
    formattedCardTypes[`${card.type.toLowerCase()}/${cardIsEnabled}`].cards.push(formatLabel(card))
  })
  return formattedCardTypes
}

const formatCardTypesForTemplate = (
  allCards: CardType[],
  acceptedCards: CardType[],
  account: GatewayAccount,
  isAdminUser: boolean
) => {
  if (isAdminUser) {
    return formatCardTypesForAdminTemplate(allCards, acceptedCards, account)
  }
  return formatCardTypesForNonAdminTemplate(allCards, acceptedCards)
}

export { formatCardTypesForTemplate, formatCardTypesForAdminTemplate, formatCardTypesForNonAdminTemplate }
