const { body } = require('express-validator')
const { safeConvertPoundsStringToPence } = require('@utils/currency-formatter')

const HINT_MAX_LENGTH = 255
const NAXSI_NOT_ALLOWED_CHARACTERS = ['<', '>', '|']

module.exports = [
  body('amount-type-group')
    .not().isEmpty().withMessage('Is the payment for a fixed amount?').bail(),
  body('payment-amount')
    .if(body('amount-type-group').equals('fixed'))
    .not().isEmpty().withMessage('Enter an amount in pounds and pence using digits and a decimal point. For example “10.50”').bail()
    .isNumeric().withMessage('Enter an amount in pounds and pence using digits and a decimal point. For example “10.50”').bail()
    .if((amount, { req }) => req.account.payment_provider === 'stripe')
    .custom((amount) => safeConvertPoundsStringToPence(amount) >= 30).withMessage('Amount must be £0.30 or more').bail(),
  body('amount-hint-text')
    .if(body('amount-type-group').not().equals('fixed'))
    .isLength({ max: HINT_MAX_LENGTH }).withMessage('The text is too long').bail()
    .custom(hintText => !NAXSI_NOT_ALLOWED_CHARACTERS.some(char => hintText.includes(char))).withMessage(`Hint text must not include ${NAXSI_NOT_ALLOWED_CHARACTERS.join(' ')}`).bail()
]
