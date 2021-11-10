'use strict'

const lodash = require('lodash')

const { getSwitchingCredential } = require('../../utils/credentials')
const { ConnectorClient } = require('../../services/clients/connector.client')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)
const { validateDateOfBirth } = require('../../utils/validation/server-side-form-validations')

const trimField = (key, store) => lodash.get(store, key, '').trim()

async function getStripeAccountId (account, isSwitchingCredentials, correlationId) {
  if (isSwitchingCredentials) {
    const switchingCredential = getSwitchingCredential(account)
    return switchingCredential.credentials.stripe_account_id
  } else {
    const stripeAccount = await connector.getStripeAccount(account.gateway_account_id, correlationId)
    return stripeAccount.stripeAccountId
  }
}

function validateField (fieldValue, fieldValidator, maxLength) {
  const isFieldValidValue = fieldValidator(fieldValue, maxLength)
  if (!isFieldValidValue.valid) {
    return isFieldValidValue.message
  }
  return null
}

function getFormFields (requestBody, listOfFields) {
  return listOfFields.reduce((form, field) => {
    form[field] = trimField(field, requestBody)
    return form
  }, {})
}

function validateDoB (day, month, year) {
  const dateOfBirthValidationResult = validateDateOfBirth(day, month, year)
  if (!dateOfBirthValidationResult.valid) {
    return dateOfBirthValidationResult.message
  }
  return null
}

module.exports = {
  getStripeAccountId: getStripeAccountId,
  validateField: validateField,
  validateDoB: validateDoB,
  getFormFields: getFormFields
}
