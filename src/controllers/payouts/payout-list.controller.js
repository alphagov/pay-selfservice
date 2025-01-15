const moment = require('moment')
const logger = require('../../utils/logger')(__filename)
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

    if (
      (filterLiveAccounts && !userPermittedAccountsSummary.gatewayAccountIds.length) || (!filterLiveAccounts && !userPermittedAccountsSummary.hasTestStripeAccount)
    ) {
      return next(new NoServicesWithPermissionError('You do not have any associated services with rights to view payments to bank accounts.'))
    }
    const payoutSearchResult = await payoutService.payouts(userPermittedAccountsSummary.gatewayAccountIds, req.user, page)
    logger.info('Fetched page of payouts for all services', {
      current_page: page,
      gateway_account_ids: userPermittedAccountsSummary.gatewayAccountIds,
      user_number_of_services: req.user.numberOfLiveServices,
      is_live: filterLiveAccounts
    })

    if (process.env.PAYOUTS_RELEASE_DATE) {
      payoutsReleaseDate = moment.unix(process.env.PAYOUTS_RELEASE_DATE)
    }
    response(req, res, 'payouts/list', { payoutSearchResult, payoutsReleaseDate, filterLiveAccounts, hasLiveAccounts: userPermittedAccountsSummary.hasLiveAccounts, hasTestStripeAccount: userPermittedAccountsSummary.hasTestStripeAccount })
  } catch (error) {
    return next(new Error('Failed to fetch payouts'))
  }
}

module.exports = {
  listAllServicesPayouts
}
