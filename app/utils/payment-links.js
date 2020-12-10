// helper methods used across the payment link creation and edit user journeys
'use strict'

const lodash = require('lodash')

const paths = require('../paths')

// the edit and create flows handle storing cookie session data in separate places,
// abstract this away from the controller by adding accessors that can be based
// based on the request

// PaymentLinksContext
// sessionData - session data specified by each flow
// addMetadataUrl - url used for adding new to the existing session
// self - the url that should be posted to when requesting new metadata is added
// cancelUrl - url used if we no longer want to add this metadata, return to the
//  correct place
// createLink - boolean that should specify if we are creating or managing a
//  payment link, this is only used by the navigation on the left

// req.originalUrl will contain the URL that we're currently accessing from

// this all may or may not be needed in a central place
function getPaymentLinksContext (req) {
  // const key = 'createPaymentLink'
  // return lodash.get(req, `session.pageData.${key}`)

  const isPaymentLinkManageFlow = Object.values(paths.paymentLinks.manage).includes(req.route.path)

  if (isPaymentLinkManageFlow) {
    const { productExternalId } = req.params

    return {
      sessionData: lodash.get(req, 'session.editPaymentLinkData'),
      addMetadataUrl: paths.generateRoute(paths.paymentLinks.manage.addMetadata, { productExternalId }),
      self: paths.generateRoute(paths.paymentLinks.manage.addMetadata, { productExternalId }),
      cancelUrl: paths.generateRoute(paths.paymentLinks.manage.edit, { productExternalId }),
      createLink: false
    }
  } else {
    // payment links creation flow

    return {
      sessionData: lodash.get(req, 'session.pageData.createPaymentLink'),

      // @TODO(sfount) will these two always be the same?
      addMetadataUrl: paths.paymentLinks.addMetadata,
      self: paths.paymentLinks.addMetadata,
      cancelUrl: paths.paymentLinks.review,
      createLink: true
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
