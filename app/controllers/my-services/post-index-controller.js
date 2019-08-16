const _ = require('lodash')
const { createLogger, format } = require('winston')
const { timestamp, json } = format
const logger = createLogger({
  format: format.combine(
    timestamp(),
    json()
  )
})

const paths = require('../../paths')

const validAccountId = (accountId, user) => {
  const gatewayAccountIds = _.flattenDeep(_.concat(user.serviceRoles.map(serviceRole => serviceRole.service.gatewayAccountIds)))
  return accountId && gatewayAccountIds.indexOf(accountId) !== -1
}

module.exports = (req, res) => {
  let newAccountId = _.get(req, 'body.gatewayAccountId')

  if (validAccountId(newAccountId, req.user)) {
    req.gateway_account.currentGatewayAccountId = newAccountId
    res.redirect(302, paths.dashboard.index)
  } else {
    logger.warn(`Attempted to switch to invalid account ${newAccountId}`)
    res.redirect(302, paths.serviceSwitcher.index)
  }
}
