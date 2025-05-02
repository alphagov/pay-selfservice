import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { NextFunction } from 'express'

import { NotFoundError } from '@root/errors'

function enforcePaymentProviderType (paymentProvider: string) {
  return function (req: ServiceRequest, _: ServiceResponse, next: NextFunction) {
    const account = req.account
    if (!account.isSwitchingToProvider(paymentProvider) && account.paymentProvider !== paymentProvider) {
      return next(new NotFoundError(`Attempted to access ${paymentProvider} setting for ${account.paymentProvider} service`))
    }
    next()
  }
}

export = enforcePaymentProviderType
