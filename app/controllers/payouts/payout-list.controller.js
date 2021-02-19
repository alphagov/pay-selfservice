const moment = require('moment')
const paths = require('../../../app/paths')
const logger = require('../../utils/logger')(__filename)
const { keys } = require('@govuk-pay/pay-js-commons').logging
const { response } = require('../../utils/response.js')
const permissions = require('../../utils/permissions')
const payoutService = require('./payouts.service')
const { NoServicesWithPermissionError } = require('../../errors')

const listAllServicesPayouts = async function listAllServicesPayouts (req, res, next) {
  const { page } = req.query

  // a filter param will be set on status specific routes, if they're not set the
  // default behaviour should be live
  const { statusFilter } = req.params
  const filterLiveAccounts = statusFilter !== 'test'

  try {
    let payoutsReleaseDate
    const userPermittedAccountsSummary = await permissions.getGatewayAccountsFor(req.user, filterLiveAccounts, 'payouts:read')

    if (!userPermittedAccountsSummary.gatewayAccountIds.length) {
      return next(new NoServicesWithPermissionError('You do not have any associated services with rights to view payments to bank accounts.'))
    }
    const payoutSearchResult = await payoutService.payouts(userPermittedAccountsSummary.gatewayAccountIds, req.user, page)
    const logContext = {
      current_page: page,
      internal_user: req.user.internalUser,
      gateway_account_ids: userPermittedAccountsSummary.gatewayAccountIds,
      user_number_of_services: req.user.numberOfLiveServices,
      is_live: filterLiveAccounts
    }
    logContext[keys.USER_EXTERNAL_ID] = req.user && req.user.externalId
    logger.info('Fetched page of payouts for all services', logContext)

    if (process.env.PAYOUTS_RELEASE_DATE) {
      payoutsReleaseDate = moment.unix(process.env.PAYOUTS_RELEASE_DATE)
    }
    response(req, res, 'payouts/list', { payoutSearchResult, paths, payoutsReleaseDate, filterLiveAccounts, hasLiveAccounts: userPermittedAccountsSummary.hasLiveAccounts })
  } catch (error) {
    return next(new Error('Failed to fetch payouts'))
  }
}

module.exports = {
  listAllServicesPayouts
}
