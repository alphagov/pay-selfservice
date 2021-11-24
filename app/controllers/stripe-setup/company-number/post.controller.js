'use strict'

const lodash = require('lodash')

const logger = require('../../../utils/logger')(__filename)
const { response } = require('../../../utils/response')
const { isSwitchingCredentialsRoute } = require('../../../utils/credentials')
const { getStripeAccountId, getAlreadySubmittedErrorPageData } = require('../stripe-setup.util')
const { updateCompany } = require('../../../services/clients/stripe/stripe.client')
const companyNumberValidations = require('./company-number-validations')
const { ConnectorClient } = require('../../../services/clients/connector.client')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)
const paths = require('../../../paths')
const formatAccountPathsFor = require('../../../utils/format-account-paths-for')

// Constants
const COMPANY_NUMBER_DECLARATION_FIELD = 'company-number-declaration'
const COMPANY_NUMBER_FIELD = 'company-number'

module.exports = async (req, res, next) => {
  const isSwitchingCredentials = isSwitchingCredentialsRoute(req)
  const stripeAccountSetup = req.account.connectorGatewayAccountStripeProgress
  if (!stripeAccountSetup) {
    return next(new Error('Stripe setup progress is not available on request'))
  }
  if (stripeAccountSetup.companyNumber) {
    const errorPageData = getAlreadySubmittedErrorPageData(req.account.external_id,
      'You’ve already provided your Company registration number. Contact GOV.UK Pay support if you need to update it.')
    return response(req, res, 'error-with-link', errorPageData)
  }

  const companyNumberDeclaration = lodash.get(req.body, COMPANY_NUMBER_DECLARATION_FIELD, '')
  const rawCompanyNumber = lodash.get(req.body, COMPANY_NUMBER_FIELD, '')
  const sanitisedCompanyNumber = rawCompanyNumber.replace(/\s/g, '').toUpperCase()

  const errors = validateCompanyNumberForm(companyNumberDeclaration, rawCompanyNumber.trim())
  if (!lodash.isEmpty(errors)) {
    return response(req, res, 'stripe-setup/company-number/index', {
      companyNumberDeclaration: companyNumberDeclaration,
      companyNumber: rawCompanyNumber,
      isSwitchingCredentials,
      errors
    })
  } else {
    try {
      const stripeCompanyBody = {
        tax_id: sanitisedCompanyNumber || 'NOTAPPLI'
      }
      const stripeAccountId = await getStripeAccountId(req.account, isSwitchingCredentials, req.correlationId)

      await updateCompany(stripeAccountId, stripeCompanyBody)
      await connector.setStripeAccountSetupFlag(req.account.gateway_account_id, 'company_number', req.correlationId)

      logger.info('Company number submitted for Stripe account', {
        stripe_account_id: stripeAccountId,
        is_switching: isSwitchingCredentials
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

function validateCompanyNumberForm (companyNumberDeclaration, companyNumber) {
  const errors = {}

  const companyNumberDeclarationValidationResult = companyNumberValidations.validateCompanyNumberDeclaration(companyNumberDeclaration)
  if (!companyNumberDeclarationValidationResult.valid) {
    errors[COMPANY_NUMBER_DECLARATION_FIELD] = companyNumberDeclarationValidationResult.message
  } else if (companyNumberDeclaration === 'true') {
    const companyNumberValidationResult = companyNumberValidations.validateCompanyNumber(companyNumber)
    if (!companyNumberValidationResult.valid) {
      errors[COMPANY_NUMBER_FIELD] = companyNumberValidationResult.message
    }
  }

  return errors
}
