'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const logger = require('../../../utils/logger')(__filename)
const { response, renderErrorView } = require('../../../utils/response')
const { updateCompany } = require('../../../services/clients/stripe/stripe.client')
const vatNumberValidations = require('./vat-number-validations')
const { ConnectorClient } = require('../../../services/clients/connector.client')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)
const paths = require('../../../paths')

// Constants
const VAT_NUMBER_FIELD = 'vat-number'

module.exports = async (req, res) => {
  const rawVatNumber = lodash.get(req.body, VAT_NUMBER_FIELD, '')
  const sanitisedVatNumber = rawVatNumber.replace(/\s/g, '').toUpperCase()

  const errors = validateVatNumber(rawVatNumber)
  if (!lodash.isEmpty(errors)) {
    return response(req, res, 'stripe-setup/vat-number/index', {
      vatNumber: rawVatNumber,
      errors
    })
  } else {
    try {
      const stripeCompanyBody = {
        vat_id: sanitisedVatNumber
      }
      await updateCompany(res.locals.stripeAccount.stripeAccountId, stripeCompanyBody)
      await connector.setStripeAccountSetupFlag(req.account.gateway_account_id, 'vat_number', req.correlationId)

      return res.redirect(303, paths.stripe.addPspAccountDetails)
    } catch (error) {
      logger.error(`[${req.correlationId}] Error submitting "VAT number" details, error = `, error)
      return renderErrorView(req, res, 'Please try again or contact support team')
    }
  }
}

function validateVatNumber (vatNumber) {
  const errors = {}

  const vatNumberValidationResult = vatNumberValidations.validateVatNumber(vatNumber)
  if (!vatNumberValidationResult.valid) {
    errors[VAT_NUMBER_FIELD] = vatNumberValidationResult.message
  }

  return errors
}
