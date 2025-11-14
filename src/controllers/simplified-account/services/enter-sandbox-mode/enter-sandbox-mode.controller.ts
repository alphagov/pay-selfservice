import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { NotFoundError } from '@root/errors'
import { NextFunction } from 'express'
import { Features } from '@root/config/experimental-features'

function get(req: ServiceRequest, res: ServiceResponse, next: NextFunction) {
  if (!Features.isEnabled(Features.MY_SERVICES)) {
    return res.redirect(
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.dashboard.index,
        req.service.externalId,
        GatewayAccountType.TEST
      )
    )
  }

  if (req.account.type !== GatewayAccountType.LIVE) {
    return next(
      new NotFoundError(
        `Unable to enter sandbox mode for service [${req.service.externalId}] - already in sandbox mode`
      )
    )
  }

  return response(req, res, 'simplified-account/services/enter-sandbox-mode/index', {
    sandboxModeUrl: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.dashboard.index,
      req.service.externalId,
      GatewayAccountType.TEST
    ),
  })
}

export { get }
