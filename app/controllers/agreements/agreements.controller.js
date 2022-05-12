const url = require('url')

const agreementsService = require('./agreements.service')

const { response } = require('../../utils/response')

async function listAgreements(req, res, next) {
  const page = req.query.page || 1

  const filters = {
    ...req.query.status && { status: req.query.status },
    ...req.query.reference && { reference: req.query.reference }
  }
  req.session.agreementsFilter = url.parse(req.url).query

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

async function agreementDetail(req, res, next) {
  const listFilter = req.session.agreementsFilter
  try {
    const agreement = await agreementsService.agreement(req.params.agreementId, req.service.externalId)
    response(req, res, 'agreements/detail', {
      agreement,
      listFilter
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  listAgreements,
  agreementDetail
}