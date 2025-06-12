import { NotFoundError } from '@root/errors'
import PaymentProviders from '@models/constants/payment-providers'
import { NextFunction } from 'express'

interface RequestWithPossibleRawAccount extends Express.Request{
  account: Record<string, string>
}

const restrictToSandboxOrStripeTestAccount = (req: RequestWithPossibleRawAccount, res: Express.Response, next: NextFunction) => {
  const provider = getProvider(req.account)
  const type = req.account.type ?? ''
  if (provider.toLowerCase() === PaymentProviders.SANDBOX ||
    (type.toLowerCase() === 'test' && provider.toLowerCase() === PaymentProviders.STRIPE)) {
    next()
  } else {
    next(new NotFoundError('This page is only available for Sandbox or Stripe test accounts'))
  }
}

const getProvider = (account: Record<string, string>) => {
  // todo: remove the guard for raw account object once test-with-your-users routes are migrated to service / account strategy
  return account.paymentProvider ?? account.payment_provider ?? ''
}

export = restrictToSandboxOrStripeTestAccount
