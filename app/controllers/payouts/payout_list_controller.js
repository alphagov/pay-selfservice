const { response, renderErrorView } = require('../../utils/response.js')
const { liveUserServicesGatewayAccounts } = require('./../../utils/valid_account_id')
const payoutService = require('./payouts_service')

const listAllServicesPayouts = async function listAllServicesPayouts (req, res) {
  try {
    const { page } = req.query
    const gatewayAccounts = await liveUserServicesGatewayAccounts(req.user)
    const payoutSearchResult = await payoutService.payouts(gatewayAccounts.accounts, req.user, page)
    response(req, res, 'payouts/list', { payoutSearchResult })
  } catch (error) {
    renderErrorView(req, res, 'Failed to fetch payouts')
  }
}

module.exports = {
  listAllServicesPayouts
}
