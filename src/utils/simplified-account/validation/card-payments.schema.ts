import { body } from 'express-validator'
import { ServiceRequest } from '@utils/types/express'
import { WORLDPAY } from '@models/constants/payment-providers'

interface GooglePayRequestBody {
  googlePay: 'on' | 'off'
}

const cardPaymentsSchema = {
  applePay: {
    validate: body('applePay').isIn(['on', 'off']).withMessage('Select an option'),
  },
  billingAddress: {
    validate: body('collectBillingAddress').isIn(['on', 'off']).withMessage('Select an option'),
  },
  defaultBillingAddressCountry: {
    validate: body('defaultBillingAddress').isIn(['on', 'off']).withMessage('Select an option'),
  },
  googlePay: {
    validate: body('googlePay').isIn(['on', 'off']).withMessage('Select an option'),
  },
  googlePayMerchantId: {
    validate: body('googlePayMerchantId')
      .if((value: string, { req }: { req: unknown }) => {
        const _req = req as ServiceRequest<GooglePayRequestBody>
        return _req.body.googlePay === 'on' && _req.account.paymentProvider === WORLDPAY
      })
      .notEmpty()
      .withMessage('Enter a Google Pay merchant ID')
      .bail()
      .matches(/[0-9a-f]{15}/)
      .withMessage('Enter a valid Google Pay merchant ID'),
  },
  hideCardNumber: {
    validate: body('hideCardNumber').isIn(['on', 'off']).withMessage('Select an option'),
  },
  hideCardSecurityCode: {
    validate: body('hideCardSecurityCode').isIn(['on', 'off']).withMessage('Select an option'),
  },
}

export { cardPaymentsSchema }
