'use strict'

const trim = require('lodash/trim')
const {utils} = require('@govuk-pay/pay-js-commons')
const SERVICE_NAME_MAX_LENGTH = 50

exports.validateServiceName = (serviceName) => {
  let errors
  let value = trim(serviceName)
  if (utils.fieldValidationChecks.isEmpty(value)) {
    errors = {
      service_name: utils.fieldValidationChecks.isEmpty(value)
    }
  } else if (utils.fieldValidationChecks.isFieldGreaterThanMaxLengthChars(value, SERVICE_NAME_MAX_LENGTH)) {
    errors = {
      service_name: utils.fieldValidationChecks.isFieldGreaterThanMaxLengthChars(value, SERVICE_NAME_MAX_LENGTH)
    }
  }
  return errors
}
