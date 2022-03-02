'use strict'

const lodash = require('lodash')

const logger = require('../../../utils/logger')(__filename)
const { response } = require('../../../utils/response')
const { isSwitchingCredentialsRoute, isAdditionalKycDataRoute, getCurrentCredential } = require('../../../utils/credentials')
const { getStripeAccountId, getAlreadySubmittedErrorPageData, completeKyc } = require('../stripe-setup.util')
const { uploadFile, updateAccount } = require('../../../services/clients/stripe/stripe.client')
const { isKycTaskListComplete } = require('../../../controllers/your-psp/kyc-tasks.service')
const { ConnectorClient } = require('../../../services/clients/connector.client')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)
const paths = require('../../../paths')
const formatAccountPathsFor = require('../../../utils/format-account-paths-for')

const GOVERNMENT_ENTITY_DOCUMENT_FIELD = 'government-entity-document'

async function postGovernmentEntityDocument (req, res, next) {
  const isSwitchingCredentials = isSwitchingCredentialsRoute(req)
  const collectingAdditionalKycData = isAdditionalKycDataRoute(req)
  const currentCredential = getCurrentCredential(req.account)

  const stripeAccountSetup = req.account.connectorGatewayAccountStripeProgress

  if (!stripeAccountSetup) {
    return next(new Error('Stripe setup progress is not available on request'))
  }
  if (stripeAccountSetup.governmentEntityDocument) {
    const errorPageData = getAlreadySubmittedErrorPageData(req.account.external_id,
      'You’ve already provided government entity document. Contact GOV.UK Pay support if you need to update it.')
    return response(req, res, 'error-with-link', errorPageData)
  }

  const file = req.file
  const errors = validateFile(file)

  if (!lodash.isEmpty(errors)) {
    return response(req, res, 'stripe-setup/government-entity-document/index', {
      isSwitchingCredentials,
      collectingAdditionalKycData,
      currentCredential,
      errors
    })
  } else {
    try {
      const stripeAccountId = await getStripeAccountId(req.account, isSwitchingCredentials, req.correlationId)

      const stripeFile = await uploadFile(`entity_document_for_account_${req.account.gateway_account_id}`, file.mimetype, file.buffer)
      await updateAccount(stripeAccountId, { entity_verification_document_id: stripeFile.id })

      await connector.setStripeAccountSetupFlag(req.account.gateway_account_id, 'government_entity_document', req.correlationId)

      logger.info('Government entity document uploaded for Stripe account', {
        stripe_account_id: stripeAccountId,
        is_switching: isSwitchingCredentials,
        collecting_additional_kyc_data: collectingAdditionalKycData
      })

      if (isSwitchingCredentials) {
        return res.redirect(303, formatAccountPathsFor(paths.account.switchPSP.index, req.account.external_id))
      } else if (collectingAdditionalKycData) {
        const taskListComplete = await isKycTaskListComplete(currentCredential)
        if (taskListComplete) {
          await completeKyc(req.account.gateway_account_id, req.service, stripeAccountId, req.correlationId)
          req.flash('generic', 'You’ve successfully added all the Know your customer details for this service.')
        } else {
          req.flash('generic', 'Document has been submitted successfully')
        }
        return res.redirect(303, formatAccountPathsFor(paths.account.yourPsp.index, req.account && req.account.external_id, currentCredential.external_id))
      }

      return res.redirect(303, formatAccountPathsFor(paths.account.stripe.addPspAccountDetails, req.account && req.account.external_id))
    } catch (err) {
      if (err.type === 'StripeInvalidRequestError' && err.param === 'file') {
        return response(req, res, 'stripe-setup/government-entity-document/index', {
          isSwitchingCredentials,
          collectingAdditionalKycData,
          currentCredential,
          errors: {
            [GOVERNMENT_ENTITY_DOCUMENT_FIELD]: 'Error uploading file to stripe. Try uploading a file with one of the following types: pdf, jpeg, png'
          }
        })
      }
      next(err)
    }
  }
}

function validateFile (file) {
  const errors = {}
  const allowedMimeTypes = ['image/jpeg', 'application/pdf', 'image/png']

  if (!file) {
    errors[GOVERNMENT_ENTITY_DOCUMENT_FIELD] = 'Select a file to upload'
  } else if (!file.mimetype || !allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
    errors[GOVERNMENT_ENTITY_DOCUMENT_FIELD] = 'File type must be pdf, jpeg or png'
  } else if (file.size > 10000000) {
    errors[GOVERNMENT_ENTITY_DOCUMENT_FIELD] = 'File size must be less than 10MB'
  }
  return errors
}

module.exports = {
  postGovernmentEntityDocument
}
