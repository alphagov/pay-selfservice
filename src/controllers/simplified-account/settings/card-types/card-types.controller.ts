import { response } from '@utils/response'
import paths from '@root/paths'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { validationResult } from 'express-validator'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'
import { formatCardTypesForTemplate } from '@utils/simplified-account/format/format-card-types'
import { getAllCardTypes, getAcceptedCardTypes, updateAcceptedCardTypes } from '@services/card-types.service'
import { cardTypesSchema, sanitiseToArray } from '@utils/simplified-account/validation/card-types.schema'
import { UpdateAcceptedCardTypesRequest } from '@models/card-type/UpdateAcceptedCardTypesRequest.class'

async function get(req: ServiceRequest, res: ServiceResponse) {
  const isAdminUser = req.user.isAdminUserForService(req.service.externalId)
  const messages = res.locals?.flash?.messages ?? []
  const allCards = await getAllCardTypes()
  const acceptedCards = await getAcceptedCardTypes(req.service.externalId, req.account.type)
  const currentAcceptedCardTypeIds = acceptedCards.map((card) => card.id)
  const cardTypes = formatCardTypesForTemplate(allCards, acceptedCards, req.account, isAdminUser)

  return response(req, res, 'simplified-account/settings/card-types/index', {
    messages,
    cardTypes,
    isAdminUser,
    currentAcceptedCardTypeIds,
  })
}

interface UpdateCardTypesBody {
  currentAcceptedCardTypeIds: string
  debit: string
  credit: string
}

async function post(req: ServiceRequest<UpdateCardTypesBody>, res: ServiceResponse) {
  const serviceExternalId = req.service.externalId
  const accountType = req.account.type
  const currentAcceptedCardTypeIds = req.body.currentAcceptedCardTypeIds?.split(',') || []

  const selectedCardTypeIds = sanitiseToArray(req.body.debit).concat(sanitiseToArray(req.body.credit))
  await cardTypesSchema.validate.run(req)
  const validationErrors = validationResult(req)

  if (!validationErrors.isEmpty()) {
    const allCards = await getAllCardTypes()
    const cardTypes = formatCardTypesForTemplate(allCards, [], req.account, true)
    const formattedValidationErrors = formatValidationErrors(validationErrors)
    return response(req, res, 'simplified-account/settings/card-types/index', {
      errors: {
        summary: formattedValidationErrors.errorSummary,
      },
      cardTypes,
      isAdminUser: true,
      currentAcceptedCardTypeIds,
    })
  }

  const noChangesToAcceptedCardTypes =
    currentAcceptedCardTypeIds.length === selectedCardTypeIds.length &&
    currentAcceptedCardTypeIds.every((item) => selectedCardTypeIds.includes(item))
  if (noChangesToAcceptedCardTypes) {
    return res.redirect(
      formatServiceAndAccountPathsFor(paths.simplifiedAccount.settings.cardTypes.index, serviceExternalId, accountType)
    )
  }

  await updateAcceptedCardTypes(
    serviceExternalId,
    accountType,
    new UpdateAcceptedCardTypesRequest().withCardTypes(selectedCardTypeIds)
  )
  req.flash('messages', { state: 'success', icon: '&check;', heading: 'Accepted card types have been updated' })
  return res.redirect(
    formatServiceAndAccountPathsFor(paths.simplifiedAccount.settings.cardTypes.index, serviceExternalId, accountType)
  )
}

module.exports = {
  get,
  post,
}
