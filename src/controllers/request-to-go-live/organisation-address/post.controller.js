'use strict'

const lodash = require('lodash')

const logger = require('@utils/logger')(__filename)
const goLiveStageToNextPagePath = require('../go-live-stage-to-next-page-path')
const goLiveStage = require('@models/constants/go-live-stage')
const paths = require('@root/paths')
const {
  validateMandatoryField,
  validateOptionalField,
  validatePostcode,
  validatePhoneNumber,
  validateUrl
} = require('@utils/validation/server-side-form-validations')
const { updateService } = require('@services/service.service')
const { ServiceUpdateRequest } = require('@models/ServiceUpdateRequest.class')
const formatServicePathsFor = require('@utils/format-service-paths-for')
const { response } = require('@utils/response')
const { countries } = require('@govuk-pay/pay-js-commons').utils
const { getStripeAccountId } = require('@controllers/stripe-setup/stripe-setup.util')
const formatAccountPathsFor = require('@utils/format-account-paths-for')
const { ConnectorClient } = require('@services/clients/connector.client')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)
const { updateOrganisationDetails } = require('@services/clients/stripe/stripe.client')
const { isSwitchingCredentialsRoute, isEnableStripeOnboardingTaskListRoute, getCurrentCredential } = require('@utils/credentials')

const clientFieldNames = {
  name: 'merchant-name',
  addressLine1: 'address-line1',
  addressLine2: 'address-line2',
  addressCity: 'address-city',
  addressPostcode: 'address-postcode',
  addressCountry: 'address-country',
  telephoneNumber: 'telephone-number',
  url: 'url'
}

const validationRuleOrgName = {
  field: clientFieldNames.name,
  validator: validateMandatoryField,
  maxLength: 100,
  fieldDisplayName: 'name'
}

const validationRules = [
  {
    field: clientFieldNames.addressLine1,
    validator: validateMandatoryField,
    maxLength: 255,
    fieldDisplayName: 'building and street'
  },
  {
    field: clientFieldNames.addressLine2,
    validator: validateOptionalField,
    maxLength: 255,
    fieldDisplayName: 'building and street'
  },
  {
    field: clientFieldNames.addressCity,
    validator: validateMandatoryField,
    maxLength: 255,
    fieldDisplayName: 'town or city'
  }
]

const validationRulesWithName = [
  validationRuleOrgName,
  ...validationRules
]

const validationRulesWithTelAndUrl = [
  {
    field: clientFieldNames.telephoneNumber,
    validator: validatePhoneNumber
  },
  {
    field: clientFieldNames.url,
    validator: validateURLWithTracking
  },
  ...validationRules
]

const validationRulesWithNameAndTelAndUrl = [
  validationRuleOrgName,
  ...validationRulesWithTelAndUrl
]

const trimField = (key, store) => lodash.get(store, key, '').trim()

function normaliseForm (formBody) {
  const fields = [
    clientFieldNames.name,
    clientFieldNames.addressLine1,
    clientFieldNames.addressLine2,
    clientFieldNames.addressCity,
    clientFieldNames.addressCountry,
    clientFieldNames.addressPostcode,
    clientFieldNames.telephoneNumber,
    clientFieldNames.url
  ]
  return fields.reduce((form, field) => {
    form[field] = trimField(field, formBody)
    return form
  }, {})
}

function validateURLWithTracking (url) {
  const result = validateUrl(url)
  if (!result.valid) {
    logger.info('Blocked provided URL', { url })
  }
  return result
}

function validateForm (form, isRequestToGoLive, isStripeSetupUserJourney) {
  const rules = isStripeSetupUserJourney ? validationRulesWithName : isRequestToGoLive ? validationRulesWithTelAndUrl : validationRulesWithNameAndTelAndUrl

  const errors = rules.reduce((errors, validationRule) => {
    const value = form[validationRule.field]
    const validationResponse = validationRule.validator(value, validationRule.maxLength,
      validationRule.fieldDisplayName, true)
    if (!validationResponse.valid) {
      errors[validationRule.field] = validationResponse.message
    }
    return errors
  }, {})

  const country = form[clientFieldNames.addressCountry]
  if (!country || country.length !== 2) {
    errors[clientFieldNames.country] = 'Select a country'
  }

  const postCode = form[clientFieldNames.addressPostcode]
  const postCodeValidResponse = validatePostcode(postCode, country)
  if (!postCodeValidResponse.valid) {
    errors[clientFieldNames.addressPostcode] = postCodeValidResponse.message
  }
  return lodash.pick(errors, Object.values(clientFieldNames))
}

async function submitForm (form, req, isRequestToGoLive, isStripeSetupUserJourney, isSwitchingCredentials) {
  if (isStripeSetupUserJourney) {
    const stripeAccountId = await getStripeAccountId(req.account, isSwitchingCredentials)

    const newOrgDetails = {
      name: form[clientFieldNames.name],
      address_line1: form[clientFieldNames.addressLine1],
      address_city: form[clientFieldNames.addressCity],
      address_postcode: form[clientFieldNames.addressPostcode],
      address_country: form[clientFieldNames.addressCountry]
    }

    const addressLine2 = form[clientFieldNames.addressLine2]

    if (addressLine2) {
      newOrgDetails.address_line2 = addressLine2
    }

    await updateOrganisationDetails(stripeAccountId, newOrgDetails)

    await connector.setStripeAccountSetupFlag(req.account.gateway_account_id, 'organisation_details')

    logger.info('Organisation details updated for Stripe account', {
      stripe_account_id: stripeAccountId
    })
  } else {
    const updateRequest = new ServiceUpdateRequest()
      .replace().merchantDetails.addressLine1(form[clientFieldNames.addressLine1])
      .replace().merchantDetails.addressLine2(form[clientFieldNames.addressLine2])
      .replace().merchantDetails.addressCity(form[clientFieldNames.addressCity])
      .replace().merchantDetails.addressPostcode(form[clientFieldNames.addressPostcode])
      .replace().merchantDetails.addressCountry(form[clientFieldNames.addressCountry])
      .replace().merchantDetails.telephoneNumber(form[clientFieldNames.telephoneNumber])
      .replace().merchantDetails.url(form[clientFieldNames.url])

    if (isRequestToGoLive) {
      updateRequest.replace().currentGoLiveStage(goLiveStage.ENTERED_ORGANISATION_ADDRESS)
    } else {
      updateRequest.replace().merchantDetails.name(form[clientFieldNames.name])
    }
    return updateService(req.service.externalId, updateRequest.formatPayload())
  }
}

function buildErrorsPageData (
  form,
  errors,
  isRequestToGoLive,
  isStripeUpdateOrgDetails,
  isSwitchingCredentials,
  isStripeSetupUserJourney,
  enableStripeOnboardingTaskList,
  currentCredential
) {
  return {
    errors,
    name: form[clientFieldNames.name],
    address_line1: form[clientFieldNames.addressLine1],
    address_line2: form[clientFieldNames.addressLine2],
    address_city: form[clientFieldNames.addressCity],
    address_postcode: form[clientFieldNames.addressPostcode],
    telephone_number: form[clientFieldNames.telephoneNumber],
    url: form[clientFieldNames.url],
    countries: countries.govukFrontendFormatted(form[clientFieldNames.addressCountry]),
    isRequestToGoLive,
    isStripeUpdateOrgDetails,
    isSwitchingCredentials,
    isStripeSetupUserJourney,
    enableStripeOnboardingTaskList,
    currentCredential
  }
}

module.exports = async function submitOrganisationAddress (req, res, next) {
  try {
    const isRequestToGoLive = Object.values(paths.service.requestToGoLive).includes(req.route && req.route.path)
    const isStripeUpdateOrgDetails = req.url ? req.url.startsWith('/your-psp/') : false
    const isSwitchingCredentials = isSwitchingCredentialsRoute(req)
    const enableStripeOnboardingTaskList = isEnableStripeOnboardingTaskListRoute(req)
    const currentCredential = getCurrentCredential(req.account)

    const isStripeSetupUserJourney = isStripeUpdateOrgDetails ? true : !!isSwitchingCredentials

    const form = normaliseForm(req.body)
    const errors = validateForm(form, isRequestToGoLive, isStripeSetupUserJourney)

    if (lodash.isEmpty(errors)) {
      const updatedService = await submitForm(form, req, isRequestToGoLive, isStripeSetupUserJourney, isSwitchingCredentials)

      if (isStripeUpdateOrgDetails) {
        if (enableStripeOnboardingTaskList) {
          res.redirect(303, formatAccountPathsFor(paths.account.yourPsp.index, req.account && req.account.external_id, req.params && req.params.credentialId))
        } else {
          res.redirect(303, formatAccountPathsFor(paths.account.stripe.addPspAccountDetails, req.account.external_id))
        }
      } else if (isSwitchingCredentials) {
        res.redirect(303, formatAccountPathsFor(paths.account.switchPSP.index, req.account.external_id))
      } else if (isRequestToGoLive) {
        res.redirect(303, formatServicePathsFor(goLiveStageToNextPagePath[updatedService.currentGoLiveStage], req.service.externalId))
      } else {
        res.redirect(303, formatServicePathsFor(paths.service.organisationDetails.index, req.service.externalId))
      }
    } else {
      const pageData = buildErrorsPageData(
        form,
        errors,
        isRequestToGoLive,
        isStripeUpdateOrgDetails,
        isSwitchingCredentials,
        isStripeSetupUserJourney,
        enableStripeOnboardingTaskList,
        currentCredential
      )

      const templatePath = isStripeSetupUserJourney ? 'stripe-setup/update-org-details/index' : 'request-to-go-live/organisation-address'
      return response(req, res, templatePath, pageData)
    }
  } catch (err) {
    next(err)
  }
}
