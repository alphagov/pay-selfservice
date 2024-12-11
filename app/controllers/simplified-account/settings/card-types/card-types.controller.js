const { response } = require('@utils/response')
const { formatCardTypesForTemplate } = require('@utils/simplified-account/format/format-card-types')
const { getAllCardTypes, getAcceptedCardTypesForServiceAndAccountType, postAcceptedCardsForServiceAndAccountType } = require('@services/card-types.service')
const paths = require('@root/paths')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')

async function get (req, res, next) {
  const serviceId = req.service.externalId
  const accountType = req.account.type
  const isAdminUser = req.user.isAdminUserForService(serviceId)
  const messages = res.locals?.flash?.messages ?? []
  const noCardTypesSelectedError = res.locals?.flash?.noCardTypesSelectedError ? { summary: [{text: res.locals?.flash?.noCardTypesSelectedError}] } : undefined
  try {
    const { card_types: allCards } = await getAllCardTypes()
    const { card_types: acceptedCards } = await getAcceptedCardTypesForServiceAndAccountType(serviceId, accountType)
    const cardTypesSelected = noCardTypesSelectedError ? [] : acceptedCards
    const cardTypes = formatCardTypesForTemplate(allCards, cardTypesSelected, req.account, isAdminUser)
    response(req, res, 'simplified-account/settings/card-types/index', {
      errors: noCardTypesSelectedError,
      messages,
      cardTypes,
      isAdminUser
    })
  } catch (err) {
    next(err)
  }
}

async function post (req, res, next) {
  const serviceId = req.service.externalId
  const accountType = req.account.type
  const selectedDebitCards = (typeof req.body.debit === 'string' ? [req.body.debit] : req.body.debit) || []
  const selectedCreditCards = (typeof req.body.credit === 'string' ? [req.body.credit] : req.body.credit) || []
  const selectedCardTypeIds = [...selectedDebitCards, ...selectedCreditCards]
  const currentAcceptedCardTypeIds = req.body.currentAcceptedCardTypeIds ? req.body.currentAcceptedCardTypeIds.split(',') : []

  if (!selectedDebitCards.length && !selectedCreditCards.length) {
    req.flash('noCardTypesSelectedError', 'You must choose at least one card')
    return res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardTypes.index, serviceId, accountType))
  }

  const noChangesToAcceptedCardTypes = (
    currentAcceptedCardTypeIds.length === selectedCardTypeIds.length &&
    currentAcceptedCardTypeIds.every(item => selectedCardTypeIds.includes(item))
  )
  if (noChangesToAcceptedCardTypes) {
    return res.redirect(
      formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardTypes.index, serviceId, accountType)
    )
  }

  try {
    const payload = {
      card_types: [...selectedCardTypeIds]
    }
    await postAcceptedCardsForServiceAndAccountType(serviceId, accountType, payload)
    req.flash('messages', { state: 'success', icon: '&check;', heading: 'Accepted card types have been updated' })
    console.log("----------\nredirecting to form with success message\n---------")
    return res.redirect(
      formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardTypes.index, serviceId, accountType)
    )
  } catch (err) {
    next(err)
  }
}

module.exports = {
  get,
  post
}
