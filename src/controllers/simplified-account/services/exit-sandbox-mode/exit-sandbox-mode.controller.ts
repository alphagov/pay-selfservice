import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { NextFunction } from 'express'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import { NotFoundError } from '@root/errors'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { Message } from '@utils/types/express/Message'
import { StatusTag } from '@models/service-status/ServiceView.class'

function get(req: ServiceRequest, res: ServiceResponse, next: NextFunction) {
  if (req.serviceView.statusTag !== StatusTag.SANDBOX_MODE) {
    return next(
      new NotFoundError(`Unable to exit sandbox mode for service [${req.service.externalId}] - not in sandbox mode`)
    )
  }

  req.flash(
    'messages',
    Message.Success('You have left sandbox mode. Any changes you make now will affect your live service.')
  )

  return res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.dashboard.index,
      req.service.externalId,
      GatewayAccountType.LIVE
    )
  )
}

export { get }
