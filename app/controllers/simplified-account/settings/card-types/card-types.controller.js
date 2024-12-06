const { response } = require('@utils/response')
const { formatCardTypesForTemplate } = require('@utils/simplified-account/format/format-card-types')
const { getAllCardTypes, getAcceptedCardTypesForServiceAndAccountType } = require('@services/card-types.service')

async function get (req, res, next) {
  const serviceId = req.service.externalId
  const accountType = req.account.type
  const isAdminUser = req.user.isAdminUserForService(serviceId)
  try {
    const { card_types: allCards } = await getAllCardTypes()
    const { card_types: acceptedCards } = await getAcceptedCardTypesForServiceAndAccountType(serviceId, accountType)
    const cardTypes = formatCardTypesForTemplate(allCards, acceptedCards, req.account, isAdminUser)
    response(req, res, 'simplified-account/settings/card-types/index',
      { cardTypes, isAdminUser })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  get
}
