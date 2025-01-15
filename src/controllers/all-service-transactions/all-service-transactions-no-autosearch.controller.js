'use strict'

const { response } = require('../../utils/response')
const { populateModel } = require('./populateModel')
const { getFilters } = require('../../utils/filters')
const permissions = require('../../utils/permissions')

module.exports = async function getTransactionsForAllServicesNoSearch (req, res, next) {
  const filters = getFilters(req)
  const { statusFilter } = req.params
  const filterLiveAccounts = statusFilter !== 'test'
  const userPermittedAccountsSummary = await permissions.getGatewayAccountsFor(req.user, filterLiveAccounts, 'transactions:read')
  const model = await populateModel(req, { results: [] }, filters, null, filterLiveAccounts, userPermittedAccountsSummary)
  model.allServicesTimeout = true
  try {
    return response(req, res, 'transactions/index', model)
  } catch (err) {
    next(new Error('Unable to fetch transaction information'))
  }
}
