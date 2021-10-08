'use strict'

const trim = require('lodash/trim')
const { isEmpty, isFieldGreaterThanMaxLengthChars } = require('./validation/field-validation-checks')
const SERVICE_NAME_MAX_LENGTH = 50

exports.validateServiceName = (serviceNameValue, serviceName = 'service_name', required) => {
  let errors = {}
  let value = trim(serviceNameValue)
  if (isEmpty(value) && required) {
    errors = {
      [serviceName]: isEmpty(value)
    }
  } else if (!isEmpty(value) && isFieldGreaterThanMaxLengthChars(value, SERVICE_NAME_MAX_LENGTH)) {
    errors = {
      [serviceName]: isFieldGreaterThanMaxLengthChars(value, SERVICE_NAME_MAX_LENGTH)
    }
  }
  return errors
}
