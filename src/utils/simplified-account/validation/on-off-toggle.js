const { body, validationResult } = require('express-validator')
const { formatValidationErrors } = require('@utils/simplified-account/format')

/**
 * @param fieldName {string}
 * @param req {Object}
 * @returns {Promise<{isValid: boolean, isOn: boolean, errors: Object}>}
 */
const validateOnOffToggle = async (fieldName, req) => {
  const validation = body(fieldName)
    .isIn(['on', 'off'])
    .withMessage('Select an option')

  await validation.run(req)
  const errors = validationResult(req)

  return {
    isValid: errors.isEmpty(),
    isOn: req.body[fieldName] === 'on',
    errors: formatValidationErrors(errors)
  }
}

const validateOnOffToggleWithInlineFields = async (fieldName, additionalChains, req) => {
  const validation = body(fieldName)
    .isIn(['on', 'off'])
    .withMessage('Select an option')

  await validation.run(req)

  const isOn = req.body[fieldName] === 'on'

  if (isOn && additionalChains.length > 0) {
    await Promise.all(additionalChains.map(validation => validation.run(req)))
  }

  const errors = validationResult(req)

  return {
    isValid: errors.isEmpty(),
    isOn: req.body[fieldName] === 'on',
    errors: formatValidationErrors(errors)
  }
}

module.exports = {
  validateOnOffToggle,
  validateOnOffToggleWithInlineFields
}
