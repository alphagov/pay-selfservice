import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { NextFunction } from 'express'
import { Features } from '@root/config/experimental-features'
import { StatusTag } from '@models/service-status/ServiceView.class'
import { NotFoundError } from '@root/errors'

function requirePspOnboarding(req: ServiceRequest, res: ServiceResponse, next: NextFunction) {
  if (!Features.isEnabled(Features.MY_SERVICES)) {
    return next()
  }

  if (req.serviceView.statusTag === StatusTag.PSP_ONBOARDING) {
    return next(
      new NotFoundError('Unable to access this resource until onboarding with payment service provider is complete')
    )
  }

  return next()
}

export { requirePspOnboarding }
