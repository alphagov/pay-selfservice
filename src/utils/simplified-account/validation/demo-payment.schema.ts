import { body } from 'express-validator'

const VALID_PAYMENT_AMOUNT_ERR_MSG = 'Enter a valid payment amount between £0.30 and £100000'

const demoPaymentSchema = {
  paymentDescription: {
    validate: body('paymentDescription')
      .trim()
      .notEmpty()
      .withMessage('Enter a payment description')
  },
  paymentAmount: {
    validate: body('paymentAmount')
      .trim()
      .notEmpty()
      .withMessage('Enter a payment amount')
      .bail()
      .isNumeric()
      .withMessage('Enter a valid payment amount')
      .bail()
      .isFloat({ min: 0.30, max: 100000 })
      .withMessage(VALID_PAYMENT_AMOUNT_ERR_MSG)
      .bail()
      .custom((value: string) => {
        // two decimal places
        return /^\d+(\.\d{2})?$/.test(value)
      })
      .withMessage(VALID_PAYMENT_AMOUNT_ERR_MSG)
  }
}

export {
  demoPaymentSchema
}
