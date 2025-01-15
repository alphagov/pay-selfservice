// helper methods used across the payment link creation and edit user journeys
'use strict'

const lodash = require('lodash')

const paths = require('../paths')
const formatAccountPathsFor = require('../utils/format-account-paths-for')

// the edit and create flows handle storing cookie session data in separate places,
// abstract this away from the controller by adding accessors that can be based
// based on the request
function getPaymentLinksContext (req) {
  const isCreatingPaymentLink = !Object.values(paths.account.paymentLinks.manage).includes(req.route && req.route.path)
  const accountExternalId = req.account && req.account.external_id
  const params = req.params || {}

  if (isCreatingPaymentLink) {
    const { metadataKey } = params

    return {
      sessionData: lodash.get(req, 'session.pageData.createPaymentLink'),
      addMetadataPageUrl: formatAccountPathsFor(paths.account.paymentLinks.addMetadata, accountExternalId),
      editMetadataPageUrl: formatAccountPathsFor(paths.account.paymentLinks.editMetadata, accountExternalId, metadataKey),
      listMetadataPageUrl: formatAccountPathsFor(paths.account.paymentLinks.review, accountExternalId),
      isCreatingPaymentLink
    }
  } else {
    const { productExternalId, metadataKey } = params

    return {
      sessionData: lodash.get(req, 'session.editPaymentLinkData'),
      addMetadataPageUrl: formatAccountPathsFor(paths.account.paymentLinks.manage.addMetadata, accountExternalId, productExternalId),
      editMetadataPageUrl: formatAccountPathsFor(paths.account.paymentLinks.manage.editMetadata, accountExternalId, productExternalId, metadataKey),
      listMetadataPageUrl: formatAccountPathsFor(paths.account.paymentLinks.manage.edit, accountExternalId, productExternalId),
      isCreatingPaymentLink
    }
  }
}

function addMetadata (paymentLinkSession = {}, key, value) {
  paymentLinkSession.metadata = paymentLinkSession.metadata || {}
  paymentLinkSession.metadata[key] = value
  return paymentLinkSession
}

function removeMetadata (paymentLinkSession = {}, key) {
  paymentLinkSession.metadata = paymentLinkSession.metadata || {}
  delete paymentLinkSession.metadata[key]
}

function updateMetadata (paymentLinkSession = {}, originalKey, key, value) {
  paymentLinkSession.metadata = paymentLinkSession.metadata || {}
  removeMetadata(paymentLinkSession, originalKey)
  addMetadata(paymentLinkSession, key, value)
  return paymentLinkSession
}

module.exports = {
  getPaymentLinksContext,
  metadata: {
    addMetadata,
    updateMetadata,
    removeMetadata
  }
}
