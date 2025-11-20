import { Request, Response, NextFunction } from 'express'
import Service from '@models/service/Service.class'
import ServiceData from '@models/service/dto/Service.dto'
import GatewayAccount from '@models/gateway-account/GatewayAccount.class'
import { GatewayAccountData } from '@models/gateway-account/dto/GatewayAccount.dto'
import { ServiceView } from '@models/service-status/ServiceView.class'
import createLogger from '@utils/logger'
import { Features } from '@root/config/experimental-features'

const logger = createLogger(__filename)

/*
  compatibility middleware to make service view available on routes not using the simplified account strategy middleware
  TODO remove this when all necessary routes are using the simplified account strategy middleware
 */
function serviceViewShim(
  req: Request & { service?: unknown; account?: unknown; serviceView?: ServiceView },
  res: Response,
  next: NextFunction
) {
  if (!Features.isEnabled(Features.HEADER)) {
    return next()
  }

  try {
    const service = req.service instanceof Service ? req.service : new Service(req.service as ServiceData)
    const account =
      req.account instanceof GatewayAccount ? req.account : new GatewayAccount(req.account as GatewayAccountData)

    req.serviceView = ServiceView.determineFor(service, account)
    return next()

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    logger.warn('Service view shim used on incompatible route')
  }
}

export { serviceViewShim }
