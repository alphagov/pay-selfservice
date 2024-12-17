const { response } = require('@utils/response')
const { formatCardTypesForTemplate } = require('@utils/simplified-account/format/format-card-types')
const { getAllCardTypes, getAcceptedCardTypesForServiceAndAccountType, postAcceptedCardsForServiceAndAccountType } = require('@services/card-types.service')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const { body, validationResult } = require('express-validator')
const paths = require('@root/paths')
const formatValidationErrors = require('@utils/simplified-account/format/format-validation-errors')

async function get (req, res, next) {
  const serviceExternalId = req.service.externalId
  const accountType = req.account.type
  const isAdminUser = req.user.isAdminUserForService(serviceExternalId)
  const messages = res.locals?.flash?.messages ?? []
  try {
    const { card_types: allCards } = await getAllCardTypes()
    const { card_types: acceptedCards } = await getAcceptedCardTypesForServiceAndAccountType(serviceExternalId, accountType)
    const currentAcceptedCardTypeIds = acceptedCards.map(card => card.id)
    const cardTypes = formatCardTypesForTemplate(allCards, acceptedCards, req.account, isAdminUser)
    response(req, res, 'simplified-account/settings/card-types/index', {
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
  const currentAcceptedCardTypeIds = req.body.currentAcceptedCardTypeIds?.split(',') || []

  const sanitiseToArray = value => Array.isArray(value) ? value : (value ? [value] : [])
  const validations = [
    body('debit').customSanitizer(sanitiseToArray),
    body('credit').customSanitizer(sanitiseToArray),
    body()
      .custom((_, { req }) => (req.body.debit?.length ?? 0) + (req.body.credit?.length ?? 0) > 0)
      .withMessage('You must choose at least one card')
  ]
  await Promise.all(validations.map(validation => validation.run(req)))
  const validationErrors = validationResult(req)
  if (!validationErrors.isEmpty()) {
    const { card_types: allCards } = await getAllCardTypes()
    const cardTypes = formatCardTypesForTemplate(allCards, [], req.account, true)
    const formattedValidationErrors = formatValidationErrors(validationErrors)
    return response(req, res, 'simplified-account/settings/card-types/index', {
      errors: {
        summary: formattedValidationErrors.errorSummary
      },
      cardTypes,
      isAdminUser: true,
      currentAcceptedCardTypeIds
    })
  }

  const selectedCardTypeIds = sanitiseToArray(req.body.debit).concat(sanitiseToArray(req.body.credit))
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
