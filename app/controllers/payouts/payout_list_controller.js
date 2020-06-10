const moment = require('moment')
const paths = require('../../../app/paths')
const logger = require('../../utils/logger')(__filename)
const { keys } = require('@govuk-pay/pay-js-commons').logging
const { response, renderErrorView } = require('../../utils/response.js')
const { liveUserServicesGatewayAccounts } = require('./../../utils/valid_account_id')
const payoutService = require('./payouts_service')

const listAllServicesPayouts = async function listAllServicesPayouts (req, res) {
  try {
    let payoutsReleaseDate
    const { page } = req.query
    const gatewayAccounts = await liveUserServicesGatewayAccounts(req.user)
    const payoutSearchResult = await payoutService.payouts(gatewayAccounts.accounts, req.user, page)
    const logContext = {
      gateway_accounts: gatewayAccounts,
      current_page: page
    }
    logContext[keys.USER_EXTERNAL_ID] = req.user && req.user.externalId
    logContext[keys.GATEWAY_ACCOUNT_ID] = gatewayAccounts
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
