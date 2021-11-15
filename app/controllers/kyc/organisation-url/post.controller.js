'use strict'

const lodash = require('lodash')

const paths = require('../../../paths')
const formatAccountPathsFor = require('../../../utils/format-account-paths-for')
const { validateUrl } = require('../../../utils/validation/server-side-form-validations')
const { getStripeAccountId } = require('../../stripe-setup/stripe-setup.util')
const { response } = require('../../../utils/response')
const { isSwitchingCredentialsRoute, isAdditionalKycDataRoute, getCurrentCredential } = require('../../../utils/credentials')
const { updateAccount } = require('../../../services/clients/stripe/stripe.client')
const logger = require('../../../utils/logger')(__filename)
const { updateService } = require('../../../services/service.service')
const { validPaths, ServiceUpdateRequest } = require('../../../models/ServiceUpdateRequest.class')

const ORGANISATION_URL = 'organisation-url'

function validateOrgUrl (organisationUrl) {
  const errors = {}

  const organisationUrlValidationResult = validateUrl(organisationUrl)
  if (!organisationUrlValidationResult.valid) {
    errors[ORGANISATION_URL] = organisationUrlValidationResult.message
  }

  return errors
}

const updateServiceWithUrl = async function (organisationUrl, serviceExternalId, correlationId) {
  const updateRequest = new ServiceUpdateRequest()
    .replace(validPaths.merchantDetails.url, organisationUrl)

  return updateService(serviceExternalId, updateRequest.formatPayload(), correlationId)
}

module.exports = async function (req, res, next) {
  const isSwitchingCredentials = isSwitchingCredentialsRoute(req)
  const collectingAdditionalKycData = isAdditionalKycDataRoute(req)
  const currentCredential = getCurrentCredential(req.account)

  const organisationUrl = lodash.get(req.body, ORGANISATION_URL, '')
  const errors = validateOrgUrl(organisationUrl)

  if (!lodash.isEmpty(errors)) {
    const pageData = {
      organisationUrl: organisationUrl
    }

    pageData['errors'] = errors

    return response(req, res, 'kyc/organisation-url', {
      ...pageData, isSwitchingCredentials, collectingAdditionalKycData, currentCredential
    })
  } else {
    try {
      const stripeAccountId = await getStripeAccountId(req.account, isSwitchingCredentials, req.correlationId)

      await updateAccount(stripeAccountId, { url: organisationUrl })

      await updateServiceWithUrl(organisationUrl, req.service.externalId, req.correlationId)

      logger.info('Organisation URL submitted for Stripe account', {
        stripe_account_id: stripeAccountId,
        is_switching: isSwitchingCredentials,
        collecting_additional_kyc_data: collectingAdditionalKycData
      })

      if (isSwitchingCredentials) {
        return res.redirect(303, formatAccountPathsFor(paths.account.switchPSP.index, req.account.external_id))
      } else if (collectingAdditionalKycData) {
        req.flash('generic', 'Organisation website address added successfully')
        return res.redirect(303, formatAccountPathsFor(paths.account.yourPsp.index, req.account && req.account.external_id, currentCredential.external_id))
      }
    } catch (err) {
      next(err)
    }
  }
}
