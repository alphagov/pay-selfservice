const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const paths = require('@root/paths')
const gatewayAccountsService = require('@services/gateway-accounts.service')
const logger = require('@utils/logger')(__filename)

module.exports = async (req, res, next) => {
  if (!req.user?.isDegatewayed()) {
    return next()
  }

  if (!req.service) {
    logger.warn('Simplified settings redirect middleware used on route with no service. Skipping redirect')
    return next()
  }

  if (req.account) {
    return res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.index, req.service.externalId, req.account.type))
  }

  const liveAccountExists = await (gatewayAccountsService.getGatewayAccountByServiceExternalIdAndType(req.service.externalId, 'live')
    .then(() => true)
    .catch(() => false))

  return res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.index, req.service.externalId, liveAccountExists ? 'live' : 'test'))
}
