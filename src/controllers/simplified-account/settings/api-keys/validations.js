const { body } = require('express-validator')
const DESCRIPTION_VALIDATION = [
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Name must not be empty')
    .isLength({ max: 50 })
    .withMessage('Name must be 50 characters or fewer')
]

const REVOKE_VALIDATION = [
  body('revokeApiKey')
    .custom((revokeApiKey, { req }) => {
      if (revokeApiKey === undefined) { throw new Error(`Confirm if you want to revoke ${req.body.apiKeyName}`) }
      return true
    })
]

module.exports = {
  DESCRIPTION_VALIDATION,
  REVOKE_VALIDATION
}
