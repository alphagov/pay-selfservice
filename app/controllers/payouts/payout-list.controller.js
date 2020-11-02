const moment = require('moment')
const paths = require('../../../app/paths')
const logger = require('../../utils/logger')(__filename)
const { keys } = require('@govuk-pay/pay-js-commons').logging
const { response, renderErrorView } = require('../../utils/response.js')
const permissions = require('../../utils/permissions')
const payoutService = require('./payouts.service')

const listAllServicesPayouts = async function listAllServicesPayouts (req, res) {
  const { page } = req.query

  try {
    let payoutsReleaseDate
    const userPermittedAccountsSummary = await permissions.getLiveGatewayAccountsFor(req.user, 'payouts:read')

    if (!userPermittedAccountsSummary.gatewayAccountIds.length) {
      res.status(401).render('error', { message: 'You do not have any associated services with rights to view payments to bank accounts.' })
      return
    }
    const payoutSearchResult = await payoutService.payouts(userPermittedAccountsSummary.gatewayAccountIds, req.user, page)
    const logContext = {
      current_page: page,
      internal_user: req.user.internalUser,
      gateway_account_ids: userPermittedAccountsSummary.gatewayAccountIds,
      user_number_of_live_services: req.user.numberOfLiveServices
    }
    logContext[keys.USER_EXTERNAL_ID] = req.user && req.user.externalId
    logger.info('Fetched page of payouts for all services', logContext)

    if (process.env.PAYOUTS_RELEASE_DATE) {
      payoutsReleaseDate = moment.unix(process.env.PAYOUTS_RELEASE_DATE)
    }
    response(req, res, 'payouts/list', { payoutSearchResult, paths, payoutsReleaseDate })
  } catch (error) {
    renderErrorView(req, res, 'Failed to fetch payouts')
  }
}

module.exports = {
  listAllServicesPayouts
}
