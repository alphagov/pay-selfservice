const _ = require('lodash')

const logger = require('../../utils/logger')(__filename)
const paths = require('../../paths')

const validAccountId = (accountId, user) => {
  const gatewayAccountIds = _.flattenDeep(_.concat(user.serviceRoles.map(serviceRole => serviceRole.service.gatewayAccountIds)))
  return accountId && gatewayAccountIds.indexOf(accountId) !== -1
}

module.exports = (req, res) => {
  const newAccountId = _.get(req, 'body.gatewayAccountId')
  const newAccountExternalId = _.get(req, 'body.gatewayAccountExternalId')

  if (validAccountId(newAccountId, req.user)) {
    req.gateway_account.currentGatewayAccountId = newAccountId
    req.gateway_account.currentGatewayAccountExternalId = newAccountExternalId

    // @TODO(sfount) we'll probably need to get account manually here
    res.redirect(302, paths.account.formatPathFor(paths.account.dashboard.index, newAccountExternalId))
  } else {
    logger.warn(`Attempted to switch to invalid account ${newAccountId}`)
    res.redirect(302, paths.serviceSwitcher.index)
  }
}
