const agreementsService = require('./agreements.service')

const { response } = require('../../utils/response')

async function listAgreements(req, res, next) {
  const page = req.query.page || 1

  try {
    const agreements = await agreementsService.agreements(req.service.externalId, req.isLive, page)

    response(req, res, 'agreements/list', {
      agreements
    })

  } catch (error) {
    next(error)
  }
}

async function agreementDetail(req, res, next) {
  const { agreementId } = req.params
  try {
    const agreement = await agreementsService.agreement(agreementId, req.service.externalId)
    response(req, res, 'agreements/detail', { agreement })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  listAgreements,
  agreementDetail
}