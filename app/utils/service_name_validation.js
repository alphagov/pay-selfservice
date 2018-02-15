'use strict'

const {isEmpty, isFieldGreaterThanMaxLengthChars} = require('../browsered/field-validation-checks')
const SERVICE_NAME_MAX_LENGTH = 50

exports.validateServiceName = (value) => {
  let errors
  if (isEmpty(value)) {
    errors = {
      service_name: isEmpty(value)
    }
  } else if (isFieldGreaterThanMaxLengthChars(value, SERVICE_NAME_MAX_LENGTH)) {
    errors = {
      service_name: isFieldGreaterThanMaxLengthChars(value, SERVICE_NAME_MAX_LENGTH)
    }
  }
  return errors
}
