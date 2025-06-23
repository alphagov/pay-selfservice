import paths from '@root/paths'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { NextFunction } from 'express'
import { STRIPE, WORLDPAY } from '@models/constants/payment-providers'
import { InvalidConfigurationError } from '@root/errors'
import createLogger from '@utils/logger'

const logger = createLogger(__filename)

function pspSwitchRedirect(req: ServiceRequest, res: ServiceResponse, next: NextFunction) {
  if (req.account.providerSwitchEnabled) {
    const paymentProvider  = req.account.getSwitchingCredential().paymentProvider
    switch (paymentProvider) {
      case STRIPE:
        return res.redirect(formatServiceAndAccountPathsFor(paths.simplifiedAccount.settings.switchPsp.switchToStripe.index, req.service.externalId, req.account.type))
      case WORLDPAY:
        return res.redirect(formatServiceAndAccountPathsFor(paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index, req.service.externalId, req.account.type))
      default:
        return next(new InvalidConfigurationError(`Could not determine switching payment provider for service [service_external_id: ${req.service.externalId}, gateway_account_external_id: ${req.account.externalId}]`))
    }
  }
  logger.warn(`PSP switch redirect attempted for account that is not provider switch enabled, falling back to settings index [service_external_id: ${req.service.externalId}, gateway_account_external_id: ${req.account.externalId}]`)
  return res.redirect(formatServiceAndAccountPathsFor(paths.simplifiedAccount.settings.index, req.service.externalId, req.account.type))
}

export = pspSwitchRedirect
