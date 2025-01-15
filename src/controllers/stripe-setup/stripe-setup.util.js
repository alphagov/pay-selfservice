'use strict'

const lodash = require('lodash')

const { getSwitchingCredential } = require('../../utils/credentials')
const { ConnectorClient } = require('../../services/clients/connector.client')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)
const { validateDateOfBirth } = require('../../utils/validation/server-side-form-validations')
const paths = require('../../paths')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')

const trimField = (key, store) => lodash.get(store, key, '').trim()

async function getStripeAccountId (account, isSwitchingCredentials) {
  if (isSwitchingCredentials) {
    const switchingCredential = getSwitchingCredential(account)
    return switchingCredential.credentials.stripe_account_id
  } else {
    const stripeAccount = await connector.getStripeAccount(account.gateway_account_id)
    return stripeAccount.stripeAccountId
  }
}

function validateField (fieldValue, fieldValidator, maxLength, fieldDisplayName) {
  const isFieldValidValue = fieldValidator(fieldValue, maxLength, fieldDisplayName, true)
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

function getAlreadySubmittedErrorPageData (accountExternalId, errorMessage) {
  return {
    error: {
      title: 'An error occurred',
      message: errorMessage
    },
    link: {
      link: formatAccountPathsFor(paths.account.dashboard.index, accountExternalId),
      text: 'Back to dashboard'
    },
    enable_link: true
  }
}

module.exports = {
  getStripeAccountId,
  validateField,
  validateDoB,
  getFormFields,
  getAlreadySubmittedErrorPageData
}
