const { response } = require('@utils/response')
const { formatCardTypesForTemplate } = require('@utils/simplified-account/format/format-card-types')
const { getAllCardTypes, getAcceptedCardTypesForServiceAndAccountType, postAcceptedCardsForServiceAndAccountType } = require('@services/card-types.service')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const paths = require('@root/paths')

async function get (req, res, next) {
  const serviceExternalId = req.service.externalId
  const accountType = req.account.type
  const isAdminUser = req.user.isAdminUserForService(serviceExternalId)
  const messages = res.locals?.flash?.messages ?? []
  let noCardTypesSelectedError
  if (res.locals?.flash?.noCardTypesSelectedError) {
    noCardTypesSelectedError = { summary: [{ text: res.locals?.flash?.noCardTypesSelectedError }] }
  }
  try {
    const { card_types: allCards } = await getAllCardTypes()
    const { card_types: acceptedCards } = await getAcceptedCardTypesForServiceAndAccountType(serviceExternalId, accountType)
    const cardTypesSelected = noCardTypesSelectedError ? [] : acceptedCards
    const currentAcceptedCardTypeIds = acceptedCards.map(card => card.id)
    const cardTypes = formatCardTypesForTemplate(allCards, cardTypesSelected, req.account, isAdminUser)
    response(req, res, 'simplified-account/settings/card-types/index', {
      errors: noCardTypesSelectedError,
      messages,
      cardTypes,
      isAdminUser,
      currentAcceptedCardTypeIds
    })
  } catch (err) {
    next(err)
  }
}

async function post (req, res, next) {
  const serviceExternalId = req.service.externalId
  const accountType = req.account.type
  const selectedDebitCards = (typeof req.body.debit === 'string' ? [req.body.debit] : req.body.debit) || []
  const selectedCreditCards = (typeof req.body.credit === 'string' ? [req.body.credit] : req.body.credit) || []
  const selectedCardTypeIds = [...selectedDebitCards, ...selectedCreditCards]
  const currentAcceptedCardTypeIds = req.body.currentAcceptedCardTypeIds ? req.body.currentAcceptedCardTypeIds.split(',') : []
  if (!selectedDebitCards.length && !selectedCreditCards.length) {
    req.flash('noCardTypesSelectedError', 'You must choose at least one card')
    return res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardTypes.index, serviceExternalId, accountType))
  }

  const noChangesToAcceptedCardTypes = (
    currentAcceptedCardTypeIds.length === selectedCardTypeIds.length &&
    currentAcceptedCardTypeIds.every(item => selectedCardTypeIds.includes(item))
  )
  if (noChangesToAcceptedCardTypes) {
    return res.redirect(
      formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardTypes.index, serviceExternalId, accountType)
    )
  }

  try {
    const payload = {
      card_types: selectedCardTypeIds
    }
    await postAcceptedCardsForServiceAndAccountType(serviceExternalId, accountType, payload)
    req.flash('messages', { state: 'success', icon: '&check;', heading: 'Accepted card types have been updated' })
    return res.redirect(
      formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardTypes.index, serviceExternalId, accountType)
    )
  } catch (err) {
    next(err)
  }
}

module.exports = {
  get,
  post
}
