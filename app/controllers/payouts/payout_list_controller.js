const paths = require('../../../app/paths')
const logger = require('../../utils/logger')(__filename)
const { response, renderErrorView } = require('../../utils/response.js')
const { liveUserServicesGatewayAccounts } = require('./../../utils/valid_account_id')
const payoutService = require('./payouts_service')

const listAllServicesPayouts = async function listAllServicesPayouts (req, res) {
  try {
    const { page } = req.query
    const gatewayAccounts = await liveUserServicesGatewayAccounts(req.user)
    const payoutSearchResult = await payoutService.payouts(gatewayAccounts.accounts, req.user, page)
    logger.info('Fetched page of payouts for all services', {
      user_id: req.user && req.user.externalId,
      gateway_accounts: gatewayAccounts,
      current_page: page
    })
    response(req, res, 'payouts/list', { payoutSearchResult, paths })
  } catch (error) {
    renderErrorView(req, res, 'Failed to fetch payouts')
  }
}

module.exports = {
  listAllServicesPayouts
}
