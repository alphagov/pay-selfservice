'use strict'

const lodash = require('lodash')

const logger = require('../../../utils/logger')(__filename)
const { response } = require('../../../utils/response')
const { isSwitchingCredentialsRoute, getCurrentCredential, isEnableStripeOnboardingTaskListRoute } = require('../../../utils/credentials')
const { getStripeAccountId, getAlreadySubmittedErrorPageData } = require('../stripe-setup.util')
const bankDetailsValidations = require('./bank-details-validations')
const { updateBankAccount } = require('../../../services/clients/stripe/stripe.client')
const { ConnectorClient } = require('../../../services/clients/connector.client')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)
const paths = require('../../../paths')
const formatAccountPathsFor = require('../../../utils/format-account-paths-for')
const fieldValidationChecks = require('../../../utils/validation/field-validation-checks')

// Constants
const ACCOUNT_NUMBER_FIELD = 'account-number'
const SORT_CODE_FIELD = 'sort-code'

module.exports = async (req, res, next) => {
  const isSwitchingCredentials = isSwitchingCredentialsRoute(req)
  const enableStripeOnboardingTaskList = isEnableStripeOnboardingTaskListRoute(req)
  const currentCredential = getCurrentCredential(req.account)
  const stripeAccountSetup = req.account.connectorGatewayAccountStripeProgress
  if (!stripeAccountSetup) {
    return next(new Error('Stripe setup progress is not available on request'))
  }
  if (stripeAccountSetup.bankAccount) {
    const errorPageData = getAlreadySubmittedErrorPageData(req.account.external_id,
      'You’ve already provided your bank details. Contact GOV.UK Pay support if you need to update them.')
    return response(req, res, 'error-with-link', errorPageData)
  }

  const rawAccountNumber = lodash.get(req.body, ACCOUNT_NUMBER_FIELD, '')
  const rawSortCode = lodash.get(req.body, SORT_CODE_FIELD, '')
  const sanitisedAccountNumber = rawAccountNumber.replace(/\D/g, '')
  const sanitisedSortCode = rawSortCode.replace(/\D/g, '')

  const errors = validateBankDetails(rawAccountNumber, rawSortCode)
  if (!lodash.isEmpty(errors)) {
    return response(req, res, 'stripe-setup/bank-details/index', {
      accountNumber: rawAccountNumber,
      sortCode: rawSortCode,
      isSwitchingCredentials,
      enableStripeOnboardingTaskList,
      currentCredential,
      errors
    })
  }

  try {
    const stripeAccountId = await getStripeAccountId(req.account, isSwitchingCredentials)

    await updateBankAccount(stripeAccountId, {
      bank_account_sort_code: sanitisedSortCode,
      bank_account_number: sanitisedAccountNumber
    })

    await connector.setStripeAccountSetupFlag(req.account.gateway_account_id, 'bank_account')

    logger.info('Bank account details submitted for Stripe account', {
      stripe_account_id: stripeAccountId,
      is_switching: isSwitchingCredentials
    })
    if (isSwitchingCredentials) {
      return res.redirect(303, formatAccountPathsFor(paths.account.switchPSP.index, req.account.external_id))
    } else if (enableStripeOnboardingTaskList) {
      return res.redirect(303, formatAccountPathsFor(paths.account.yourPsp.index, req.account && req.account.external_id, req.params && req.params.credentialId))
    } else {
      return res.redirect(303, formatAccountPathsFor(paths.account.stripe.addPspAccountDetails, req.account && req.account.external_id))
    }
  } catch (error) {
    // check if it is Stripe related error
    if (error.code) {
      if (error.code === 'routing_number_invalid') {
        // invalid sort code
        return response(req, res, 'stripe-setup/bank-details/index', {
          accountNumber: rawAccountNumber,
          sortCode: rawSortCode,
          isSwitchingCredentials,
          enableStripeOnboardingTaskList,
          currentCredential,
          errors: {
            [SORT_CODE_FIELD]: fieldValidationChecks.validationErrors.invalidSortCode
          }
        })
      }
      if (error.code === 'account_number_invalid') {
        // invalid account number
        return response(req, res, 'stripe-setup/bank-details/index', {
          accountNumber: rawAccountNumber,
          sortCode: rawSortCode,
          isSwitchingCredentials,
          enableStripeOnboardingTaskList,
          currentCredential,
          errors: {
            [ACCOUNT_NUMBER_FIELD]: fieldValidationChecks.validationErrors.invalidBankAccountNumber
          }
        })
      }
    }
    next(error)
  }
}

function validateBankDetails (accountNumber, sortCode) {
  const errors = {}

  const sortCodeValidationResult = bankDetailsValidations.validateSortCode(sortCode)
  if (!sortCodeValidationResult.valid) {
    errors[SORT_CODE_FIELD] = sortCodeValidationResult.message
  }

  const accountNumberValidationResult = bankDetailsValidations.validateAccountNumber(accountNumber)
  if (!accountNumberValidationResult.valid) {
    errors[ACCOUNT_NUMBER_FIELD] = accountNumberValidationResult.message
  }

  return errors
}
