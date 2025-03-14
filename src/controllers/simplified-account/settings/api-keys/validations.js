const { body } = require('express-validator')
const DESCRIPTION_VALIDATION = [
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Enter the API key name')
    .isLength({ max: 50 })
    .withMessage('Name must be 50 characters or fewer')
]

module.exports = DESCRIPTION_VALIDATION
