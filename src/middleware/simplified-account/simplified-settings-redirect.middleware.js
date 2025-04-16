const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const paths = require('@root/paths')
const gatewayAccountsService = require('@services/gateway-accounts.service')
const logger = require('@utils/logger')('simplified-settings-redirect.middleware.js')

module.exports = async (req, res, next) => {
  if (!req.service) {
    logger.warn('Simplified settings redirect middleware used on route with no service. Skipping redirect')
    return next()
  }

  if (req.account) {
    logger.info('Redirecting to simplified settings using account specified in URL')
    return res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.index, req.service.externalId, req.account.type))
  }

  const liveAccountExists = await (gatewayAccountsService.getGatewayAccountByServiceExternalIdAndType(req.service.externalId, 'live')
    .then(() => true)
    .catch(() => false))

  if (liveAccountExists) {
    logger.info('Live account exists for service. Redirecting to simplified settings for "live" account type')
  } else {
    logger.info('No live account exists for service. Redirecting to simplified settings for "test" account type')
  }

  return res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.index, req.service.externalId, liveAccountExists ? 'live' : 'test'))
}
