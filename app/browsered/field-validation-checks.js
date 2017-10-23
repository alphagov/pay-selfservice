'use strict'

const validationErrors = {
  required: 'This is field cannot be blank',
  email: 'Please use a valid email address',
  currency: 'Choose an amount in pounds and pence using digits and a decimal point. For example “10.50”'
}

module.exports.isEmpty = function (value) {
  if (value === '') {
    return validationErrors.required
  } else {
    return false
  }
}

module.exports.isCurrency = function (value) {
  if (!/^([0-9]+)(?:\.([0-9]{2}))?$/.test(value)) {
    return validationErrors.currency
  } else {
    return false
  }
}
