import { NotFoundError } from '@root/errors'
import PaymentProviders from '@models/constants/payment-providers'
import { NextFunction } from 'express'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'

const restrictToSandboxOrStripeTestAccount = (req: ServiceRequest, _: ServiceResponse, next: NextFunction) => {
  const provider = req.account.paymentProvider
  const type = req.account.type ?? ''
  if (provider.toLowerCase() === PaymentProviders.SANDBOX ||
    (type.toLowerCase() === 'test' && provider.toLowerCase() === PaymentProviders.STRIPE)) {
    next()
  } else {
    next(new NotFoundError('This page is only available for Sandbox or Stripe test accounts'))
  }
}



export = restrictToSandboxOrStripeTestAccount
