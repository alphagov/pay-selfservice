'use strict'

const lodash = require('lodash')

const logger = require('../../../utils/logger')(__filename)
const { response } = require('../../../utils/response')
const { isSwitchingCredentialsRoute } = require('../../../utils/credentials')
const { getStripeAccountId, getAlreadySubmittedErrorPageData } = require('../stripe-setup.util')
const { uploadFile, updateAccountVerification } = require('../../../services/clients/stripe/stripe.client')
const { ConnectorClient } = require('../../../services/clients/connector.client')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)
const paths = require('../../../paths')
const formatAccountPathsFor = require('../../../utils/format-account-paths-for')

const FILE_UPLOAD_FIELD = 'file-upload'

module.exports = async (req, res, next) => {
  const isSwitchingCredentials = isSwitchingCredentialsRoute(req)
  const stripeAccountSetup = req.account.connectorGatewayAccountStripeProgress

  if (!stripeAccountSetup) {
    return next(new Error('Stripe setup progress is not available on request'))
  }
  if (stripeAccountSetup.governmentEntityDocument) {
    const errorPageData = getAlreadySubmittedErrorPageData(req.account.external_id,
      'You’ve already provided government entity document. Contact GOV.UK Pay support if you need to update it.')
    return response(req, res, 'error-with-link', errorPageData)
  }

  let errors
  const file = req.file

  errors = validateFile(file)

  if (!lodash.isEmpty(errors)) {
    return response(req, res, 'stripe-setup/government-entity-document/index', {
      isSwitchingCredentials,
      errors
    })
  } else {
    try {
      const stripeAccountId = await getStripeAccountId(req.account, isSwitchingCredentials, req.correlationId)

      const stripeFile = await uploadFile(`entity_document_for_account_${req.account.gateway_account_id}`, file.mimetype, file.buffer)
      await updateAccountVerification(stripeAccountId, stripeFile.id)

      await connector.setStripeAccountSetupFlag(req.account.gateway_account_id, 'government_entity_document', req.correlationId)

      logger.info('Government entity document uploaded for Stripe account', {
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

function validateFile (file) {
  const errors = {}
  const allowedMimeTypes = ['image/jpeg', 'application/pdf', 'image/png']

  if (!file) {
    errors[FILE_UPLOAD_FIELD] = 'Select a file to upload'
  } else if (!file.mimetype || !allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
    errors[FILE_UPLOAD_FIELD] = 'File type must be pdf, jpeg or png'
  } else if (file.size > 10000000) {
    errors[FILE_UPLOAD_FIELD] = 'File size must be less than 10MB'
  }
  return errors
}
