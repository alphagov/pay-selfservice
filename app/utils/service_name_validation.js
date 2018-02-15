'use strict'

const trim = require('lodash/trim')
const {isEmpty, isFieldGreaterThanMaxLengthChars} = require('../browsered/field-validation-checks')
const SERVICE_NAME_MAX_LENGTH = 50

exports.validateServiceName = (serviceName) => {
  let errors
  let value = trim(serviceName)
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
