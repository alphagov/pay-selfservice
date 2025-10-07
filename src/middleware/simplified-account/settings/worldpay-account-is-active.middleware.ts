import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { NextFunction } from 'express'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { WORLDPAY } from '@models/constants/payment-providers'
import paths from '@root/paths'

export = function (req: ServiceRequest, res: ServiceResponse, next: NextFunction) {
  const account = req.account
  const service = req.service
  if (account.paymentProvider === WORLDPAY && account.getActiveCredential() === undefined) {
    return res.redirect(
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.cardPayments.index,
        service.externalId,
        account.type
      )
    )
  }

  return next()
}
