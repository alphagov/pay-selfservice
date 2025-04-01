'use strict'

const {
  validateEmail,
  validatePhoneNumber,
  validatePassword
} = require('@utils/validation/server-side-form-validations')

const { isEmpty } = require('@utils/validation/field-validation-checks')
const {
  REPEAT_PASSWORD_INPUT_FIELD_NAME, PASSWORD_INPUT_FIELD_NAME, PHONE_NUMBER_INPUT_FIELD_NAME,
  EMAIL_INPUT_FIELD_NAME
} = require('@controllers/registration/constants')

function validateRegistrationForm (email, phoneNumber, password, repeatPassword) {
  const errors = {}

  const validEmail = validateEmail(email)
  if (!validEmail.valid) {
    errors[EMAIL_INPUT_FIELD_NAME] = validEmail.message
  }
  const validPhoneNumber = validatePhoneNumber(phoneNumber)
  if (!validPhoneNumber.valid) {
    errors[PHONE_NUMBER_INPUT_FIELD_NAME] = validPhoneNumber.message
  }

  const passwordValidationResult = validatePassword(password)
  if (!passwordValidationResult.valid) {
    errors.password = passwordValidationResult.message
  }
  if (isEmpty(repeatPassword)) {
    errors[REPEAT_PASSWORD_INPUT_FIELD_NAME] = 'Re-type your password'
  } else if (!errors[PASSWORD_INPUT_FIELD_NAME] && password !== repeatPassword) {
    errors[PASSWORD_INPUT_FIELD_NAME] = errors[REPEAT_PASSWORD_INPUT_FIELD_NAME] = 'Enter same password in both fields'
  }

  return errors
}

module.exports = {
  validateRegistrationForm
}
