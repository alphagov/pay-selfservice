const { body } = require('express-validator')

const ONE_OFF_CUSTOMER_INITIATED_SCHEMA = {
  merchantCode: {
    validate: body('merchantCode')
      .not()
      .isEmpty()
      .withMessage('Enter your merchant code')
      .bail()
      .custom((value, { req }) => {
        if (
          req.account.allowMoto &&
          !value.endsWith('MOTO') &&
          !value.endsWith('MOTOGBP') &&
          !value.endsWith('MOTONI')
        ) {
          throw new Error('Enter a MOTO merchant code. MOTO payments are enabled for this account')
        }
        return true
      }),
  },
  username: {
    validate: body('username').not().isEmpty().withMessage('Enter your username'),
  },
  password: {
    validate: body('password').not().isEmpty().withMessage('Enter your password'),
  },
}

const THREE_DS_FLEX_VALIDATION = [
  body('organisationalUnitId')
    .notEmpty()
    .withMessage('Enter your organisational unit ID')
    .bail()
    .isHexadecimal()
    .withMessage('Enter your organisational unit ID in the format you received it')
    .bail()
    .isLength({ min: 24, max: 24 })
    .withMessage('Enter your organisational unit ID in the format you received it')
    .bail(),
  body('issuer')
    .notEmpty()
    .withMessage('Enter your issuer')
    .bail()
    .isHexadecimal()
    .withMessage('Enter your issuer in the format you received it')
    .bail()
    .isLength({ min: 24, max: 24 })
    .withMessage('Enter your issuer in the format you received it')
    .bail(),
  body('jwtMacKey')
    .notEmpty()
    .withMessage('Enter your JWT MAC key')
    .bail()
    .isUUID('loose')
    .withMessage('Enter your JWT MAC key in the format you received it')
    .bail(),
]

module.exports = {
  ONE_OFF_CUSTOMER_INITIATED_SCHEMA,
  THREE_DS_FLEX_VALIDATION,
}
