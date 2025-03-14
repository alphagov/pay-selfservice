const { body } = require('express-validator')

const apiKeySchema = {
  keyName: {
    validate: body('keyName')
      .trim()
      .notEmpty()
      .withMessage('Enter the API key name')
      .isLength({ max: 50 })
      .withMessage('Name must be 50 characters or fewer')
  }
}

module.exports = {
  apiKeySchema
}
