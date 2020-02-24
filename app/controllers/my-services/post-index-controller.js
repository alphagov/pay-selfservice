const _ = require('lodash')

const logger = require('../../utils/logger')(__filename)
const paths = require('../../paths')
const validAccountId = require('../../utils/valid_account_id')

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
