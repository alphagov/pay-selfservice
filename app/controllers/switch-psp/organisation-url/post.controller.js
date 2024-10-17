'use strict'

const lodash = require('lodash')

const paths = require('../../../paths')
const formatAccountPathsFor = require('../../../utils/format-account-paths-for')
const { validateUrl } = require('../../../utils/validation/server-side-form-validations')
const { validationErrors } = require('../../../utils/validation/field-validation-checks')
const { getStripeAccountId } = require('../../stripe-setup/stripe-setup.util')
const { response } = require('../../../utils/response')
const { isSwitchingCredentialsRoute, getCurrentCredential } = require('../../../utils/credentials')
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

const updateServiceWithUrl = async function (organisationUrl, serviceExternalId) {
  const updateRequest = new ServiceUpdateRequest()
    .replace(validPaths.merchantDetails.url, organisationUrl)

  return updateService(serviceExternalId, updateRequest.formatPayload())
}

module.exports = async function (req, res, next) {
  const isSwitchingCredentials = isSwitchingCredentialsRoute(req)
  const currentCredential = getCurrentCredential(req.account)

  const organisationUrl = lodash.get(req.body, ORGANISATION_URL, '')
  const errors = validateOrgUrl(organisationUrl)

  const pageData = {
    organisationUrl
  }
  if (!lodash.isEmpty(errors)) {
    pageData.errors = errors

    return response(req, res, 'switch-psp/organisation-url', {
      ...pageData, isSwitchingCredentials, currentCredential
    })
  } else {
    try {
      const stripeAccountId = await getStripeAccountId(req.account, isSwitchingCredentials)

      await updateAccount(stripeAccountId, { url: organisationUrl })

      await updateServiceWithUrl(organisationUrl, req.service.externalId)

      logger.info('Organisation URL submitted for Stripe account', {
        stripe_account_id: stripeAccountId,
        is_switching: isSwitchingCredentials
      })

      return res.redirect(303, formatAccountPathsFor(paths.account.switchPSP.index, req.account.external_id))
    } catch (err) {
      if (err.code && err.code === 'url_invalid') {
        return response(req, res, 'switch-psp/organisation-url', {
          ...pageData,
          isSwitchingCredentials,
          currentCredential,
          errors: {
            [ORGANISATION_URL]: validationErrors.invalidUrl
          }
        })
      }
      next(err)
    }
  }
}
