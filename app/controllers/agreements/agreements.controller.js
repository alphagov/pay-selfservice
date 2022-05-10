const agreementsService = require('./agreements.service')

const { response } = require('../../utils/response')

async function listAgreements(req, res, next) {
  const page = req.query.page || 1

  const filters = {
    ...req.query.status && { status: req.query.status },
    ...req.query.reference && { reference: req.query.reference }
  }

  try {
    const agreements = await agreementsService.agreements(req.service.externalId, req.isLive, page, filters)

    response(req, res, 'agreements/list', {
      agreements,
      filters
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  listAgreements
}