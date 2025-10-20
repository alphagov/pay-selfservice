import { response } from '@utils/response'
import paths from '@root/paths'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { GB_COUNTRY_CODE } from '@controllers/simplified-account/settings/card-payments/constants'
import { WORLDPAY } from '@models/constants/payment-providers'

import * as collectBillingAddress from './collect-billing-address.controller'
import * as defaultBillingAddressCountry from './default-billing-address-country.controller'
import * as applePay from './apple-pay.controller'
import * as googlePay from './google-pay.controller'
import * as motoSecurity from './moto-security/index'

function get(req: ServiceRequest, res: ServiceResponse) {
  const service = req.service
  const account = req.account
  const user = req.user
  const country = service.defaultBillingAddressCountry === GB_COUNTRY_CODE ? 'United Kingdom' : 'None'
  const motoSettings = {
    isMoto: account.allowMoto,
    hideCardNumberEnabled: account.motoMaskCardNumber,
    hideCardNumberLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.cardPayments.motoSecurity.hideCardNumber,
      service.externalId,
      account.type
    ),
    hideCardSecurityCodeEnabled: account.motoMaskCardSecurityCode,
    hideCardSecurityCodeLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.cardPayments.motoSecurity.hideCardSecurityCode,
      service.externalId,
      account.type
    ),
  }

  const googlePayEditable = account.paymentProvider !== WORLDPAY || account.getActiveCredential() !== undefined

  response(req, res, 'simplified-account/settings/card-payments/index', {
    userCanUpdatePaymentTypes: user.hasPermission(service.externalId, 'payment-types:update'),
    collectBillingAddressEnabled: service.collectBillingAddress,
    collectBillingAddressLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.cardPayments.collectBillingAddress,
      service.externalId,
      account.type
    ),
    defaultBillingAddressCountry: country,
    defaultBillingAddressCountryLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.cardPayments.defaultBillingAddressCountry,
      service.externalId,
      account.type
    ),
    applePayEnabled: account?.allowApplePay,
    applePayLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.cardPayments.applePay,
      service.externalId,
      account.type
    ),
    googlePayEnabled: account?.allowGooglePay,
    googlePayLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.cardPayments.googlePay,
      service.externalId,
      account.type
    ),
    googlePayEditable,
    ...(motoSettings.isMoto && motoSettings),
  })
}

module.exports = {
  get,
  collectBillingAddress,
  defaultBillingAddressCountry,
  applePay,
  googlePay,
  motoSecurity,
}
