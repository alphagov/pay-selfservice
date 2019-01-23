'use strict'

const trim = require('lodash/trim')
const { isEmpty, isFieldGreaterThanMaxLengthChars } = require('../browsered/field-validation-checks')
const ORGANISATION_NAME_MAX_LENGTH = 255

exports.validateOrganisationName = (organisationValue, organisationName = 'organisation_name', required) => {
  let errors = {}
  let value = trim(organisationValue)
  if (isEmpty(value) && required) {
    errors = {
      [organisationName]: isEmpty(value)
    }
  } else if (!isEmpty(value) && isFieldGreaterThanMaxLengthChars(value, ORGANISATION_NAME_MAX_LENGTH)) {
    errors = {
      [organisationName]: isFieldGreaterThanMaxLengthChars(value, ORGANISATION_NAME_MAX_LENGTH)
    }
  }
  return errors
}
