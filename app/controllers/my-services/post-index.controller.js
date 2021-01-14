const _ = require('lodash')

const logger = require('../../utils/logger')(__filename)
const paths = require('../../paths')

const validAccountId = (accountId, user) => {
  const gatewayAccountIds = _.flattenDeep(_.concat(user.serviceRoles.map(serviceRole => serviceRole.service.gatewayAccountIds)))
  return accountId && gatewayAccountIds.indexOf(accountId) !== -1
}

module.exports = (req, res) => {
  const gatewayAccountId = req.body && req.body.gatewayAccountId
  const gatewayAccountExternalId = req.body && req.body.gatewayAccountExternalId

  if (validAccountId(gatewayAccountId, req.user)) {
    req.gateway_account.currentGatewayAccountId = gatewayAccountId
    req.gateway_account.currentGatewayAccountExternalId = gatewayAccountExternalId
    res.redirect(302, paths.dashboard.index)
  } else {
    logger.warn(`Attempted to switch to invalid account ${gatewayAccountId}`)
    res.redirect(302, paths.serviceSwitcher.index)
  }
}
