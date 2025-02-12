const { body } = require('express-validator')

const oneOffCustomerInitiatedSchema = {
  merchantCode: {
    validate: body('merchantCode')
      .not()
      .isEmpty()
      .withMessage('Enter your merchant code')
      .bail()
      .custom((value, { req }) => {
        if (req.account.allowMoto && !value.endsWith('MOTO') && !value.endsWith('MOTOGBP')) {
          throw new Error('Enter a MOTO merchant code. MOTO payments are enabled for this account')
        }
        return true
      })
  },
  username: {
    validate: body('username')
      .not()
      .isEmpty()
      .withMessage('Enter your username')
  },
  password: {
    validate: body('password')
      .not()
      .isEmpty()
      .withMessage('Enter your password')
  }
}

module.exports = {
  oneOffCustomerInitiatedSchema
}
