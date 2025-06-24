import { NotFoundError } from '@root/errors'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { NextFunction } from 'express'

function restrictToSwitchingAccount (paymentProvider: string) {
  return function(req: ServiceRequest, _: ServiceResponse, next: NextFunction) {
    if (req.account.isSwitchingToProvider(paymentProvider)) {
      next()
    } else {
      next(new NotFoundError(`This page is only available for accounts flagged as switching provider to ${paymentProvider}`))
    }
  }
}

export = restrictToSwitchingAccount
