const { response, renderErrorView } = require('../../utils/response.js')
const { liveUserServicesGatewayAccounts } = require('./../../utils/valid_account_id')
const payoutService = require('./payouts_service')

const listAllServicesPayouts = async function listAllServicesPayouts (req, res) {
  try {
    const gatewayAccounts = await liveUserServicesGatewayAccounts(req.user)
    const payoutGroups = await payoutService.payouts(gatewayAccounts.accounts, req.user)
    response(req, res, 'payouts/list', { payoutGroups })
  } catch (error) {
    renderErrorView(req, res, 'Failed to fetch payouts')
  }
}

module.exports = {
  listAllServicesPayouts
}
