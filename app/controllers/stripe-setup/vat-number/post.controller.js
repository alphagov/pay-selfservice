'use strict'

const lodash = require('lodash')

const logger = require('../../../utils/logger')(__filename)
const { response } = require('../../../utils/response')
const { isSwitchingCredentialsRoute, getSwitchingCredential } = require('../../../utils/credentials')
const { updateCompany } = require('../../../services/clients/stripe/stripe.client')
const vatNumberValidations = require('./vat-number-validations')
const { ConnectorClient } = require('../../../services/clients/connector.client')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)
const paths = require('../../../paths')
const formatAccountPathsFor = require('../../../utils/format-account-paths-for')

// Constants
const VAT_NUMBER_FIELD = 'vat-number'
const VAT_NUMBER_PROVIDED_FIELD = 'vat-number-declaration'

module.exports = async (req, res, next) => {
  const isSwitchingCredentials = isSwitchingCredentialsRoute(req)
  const stripeAccountSetup = req.account.connectorGatewayAccountStripeProgress

  if (!stripeAccountSetup) {
    return next(new Error('Stripe setup progress is not available on request'))
  }
  if (stripeAccountSetup.vatNumber) {
    req.flash('genericError', 'You’ve already provided your VAT number. Contact GOV.UK Pay support if you need to update it.')
    return res.redirect(303, formatAccountPathsFor(paths.account.dashboard.index, req.account.external_id))
  }

  const rawVatNumber = lodash.get(req.body, VAT_NUMBER_FIELD, '')
  const sanitisedVatNumber = rawVatNumber.replace(/\s/g, '').toUpperCase()
  const vatNumberDeclaration = lodash.get(req.body, VAT_NUMBER_PROVIDED_FIELD)
  const isVatNumberProvided = vatNumberDeclaration === 'true'

  let errors
  if (isVatNumberProvided) {
    errors = validateVatNumber(rawVatNumber)
  } else {
    errors = validateVatDeclaration(vatNumberDeclaration)
  }
  if (!lodash.isEmpty(errors)) {
    return response(req, res, 'stripe-setup/vat-number/index', {
      vatNumber: rawVatNumber,
      vatNumberDeclaration: vatNumberDeclaration,
      isSwitchingCredentials,
      errors
    })
  } else {
    try {
      let stripeAccountId

      if (isSwitchingCredentials) {
        const switchingCredential = getSwitchingCredential(req.account)
        stripeAccountId = switchingCredential.credentials.stripe_account_id
      } else {
        const stripeAccount = await connector.getStripeAccount(req.account.gateway_account_id, req.correlationId)
        stripeAccountId = stripeAccount.stripeAccountId
      }
      if (isVatNumberProvided) {
        const stripeCompanyBody = {
          vat_id: sanitisedVatNumber
        }
        await updateCompany(stripeAccountId, stripeCompanyBody)
      }
      await connector.setStripeAccountSetupFlag(req.account.gateway_account_id, 'vat_number', req.correlationId)

      logger.info('VAT number submitted for Stripe account', {
        stripe_account_id: stripeAccountId,
        is_switching: isSwitchingCredentials,
        vat_provided: isVatNumberProvided
      })
      if (isSwitchingCredentials) {
        return res.redirect(303, formatAccountPathsFor(paths.account.switchPSP.index, req.account.external_id))
      } else {
        return res.redirect(303, formatAccountPathsFor(paths.account.stripe.addPspAccountDetails, req.account && req.account.external_id))
      }
    } catch (err) {
      next(err)
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

function validateVatDeclaration (vatNumberDeclaration) {
  const errors = {}
  const vatNumberDeclarationResult = vatNumberValidations.validateVatNumberDeclaration(vatNumberDeclaration)
  if (!vatNumberDeclarationResult.valid) {
    errors[VAT_NUMBER_PROVIDED_FIELD] = vatNumberDeclarationResult.message
  }

  return errors
}
