const { body } = require('express-validator')
const { WORLDPAY } = require('@models/constants/payment-providers')

const GOOGLE_PAY_TOGGLE_FIELD = 'googlePay'
const GOOGLE_PAY_MERCHANT_ID_FIELD = 'googlePayMerchantId'

const googlePaySchema = {
  onOffToggle: {
    validate: body(GOOGLE_PAY_TOGGLE_FIELD)
      .isIn(['on', 'off'])
      .withMessage('Select an option')
  },
  googlePayMerchantId: {
    validate: body(GOOGLE_PAY_MERCHANT_ID_FIELD)
      .if((value, { req }) => {
        return req.body[GOOGLE_PAY_TOGGLE_FIELD] === 'on' &&
          req.account.paymentProvider === WORLDPAY
      })
      .notEmpty()
      .withMessage('Enter a Google Pay merchant ID')
      .bail()
      .matches(/[0-9a-f]{15}/)
      .withMessage('Enter a valid Google Pay merchant ID')
  }
}

module.exports = {
  googlePaySchema,
  GOOGLE_PAY_TOGGLE_FIELD,
  GOOGLE_PAY_MERCHANT_ID_FIELD
}
