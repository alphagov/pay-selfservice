'use strict'

const lodash = require('lodash')

const { getSwitchingCredential } = require('../../utils/credentials')
const { ConnectorClient } = require('../../services/clients/connector.client')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)
const { validateDateOfBirth } = require('../../utils/validation/server-side-form-validations')
const paths = require('../../paths')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const { listPersons, addNewCapabilities, removeLegacyPaymentsCapability } = require('../../services/clients/stripe/stripe.client')
const logger = require('../../utils/logger')(__filename)
const { formatPhoneNumberWithCountryCode } = require('../../utils/telephone-number-utils')

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

async function getExistingResponsiblePersonName (account, isSwitchingCredentials, correlationId) {
  const stripeAccountId = await getStripeAccountId(account, isSwitchingCredentials, correlationId)
  const personsResponse = await listPersons(stripeAccountId)
  const responsiblePerson = personsResponse.data.filter(person => person.relationship && person.relationship.representative).pop()
  if (!responsiblePerson) {
    throw new Error('No responsible person exists for Stripe account')
  }
  return `${responsiblePerson.first_name} ${responsiblePerson.last_name}`
}

async function completeKyc (gatewayAccountId, service, stripeAccountId, correlationId) {
  let telephoneNumber = lodash.get(service, 'merchantDetails.telephone_number')
  let formattedPhoneNumber

  if (telephoneNumber) {
    formattedPhoneNumber = formatPhoneNumberWithCountryCode(telephoneNumber)
  }

  const [stripeAccountResponse] = await Promise.all([
    addNewCapabilities(stripeAccountId, service.merchantDetails.name, formattedPhoneNumber),
    connector.setStripeAccountSetupFlag(gatewayAccountId, 'additional_kyc_data', correlationId),
    connector.disableCollectAdditionalKyc(gatewayAccountId, correlationId)
  ])

  const stripeLegacyPayments = lodash.get(stripeAccountResponse, 'capabilities.legacy_payments')
  if (stripeLegacyPayments === 'active') {
    await removeLegacyPaymentsCapability(stripeAccountId)
  }

  logger.info('KYC additional information completed for Stripe account', {
    stripe_account_id: stripeAccountId
  })
}

module.exports = {
  getStripeAccountId,
  validateField,
  validateDoB,
  getFormFields,
  getAlreadySubmittedErrorPageData,
  getExistingResponsiblePersonName,
  completeKyc
}
