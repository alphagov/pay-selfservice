const _ = require('lodash')

const logger = require('../../utils/logger')(__filename)
const paths = require('../../paths')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')

const validAccountId = (accountId, user) => {
  const gatewayAccountIds = _.flattenDeep(_.concat(user.serviceRoles.map(serviceRole => serviceRole.service.gatewayAccountIds)))
  return accountId && gatewayAccountIds.indexOf(accountId) !== -1
}

module.exports = (req, res) => {
  const gatewayAccountId = req.body && req.body.gatewayAccountId
  const gatewayAccountExternalId = req.body && req.body.gatewayAccountExternalId

  if (validAccountId(gatewayAccountId, req.user) || req.user.hasGlobalRole()) {
    res.redirect(302, formatAccountPathsFor(paths.account.dashboard.index, gatewayAccountExternalId))
  } else {
    logger.warn(`Attempted to switch to invalid account ${gatewayAccountId}`)
    res.redirect(302, paths.serviceSwitcher.index)
  }
}
