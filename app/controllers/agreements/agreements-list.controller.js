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
    return next(error)
  }
}

module.exports = {
  listAgreements
}