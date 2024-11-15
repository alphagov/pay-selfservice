const { body } = require('express-validator')

const ORGANISATION_NAME_MAX_LENGTH = 100

module.exports.validators = [
  body('organisation-name').trim()
    .notEmpty().withMessage('Enter an organisation name')
    .isLength({ max: ORGANISATION_NAME_MAX_LENGTH }).withMessage(`Organisation name  must be ${ORGANISATION_NAME_MAX_LENGTH} characters or fewer`)
]
