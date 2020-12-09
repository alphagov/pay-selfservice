// helper methods used across the payment link creation and edit user journeys
'use strict'

const lodash = require('lodash')

// the edit and create flows handle storing cookie session data in separate places,
// abstract this away from the controller by adding accessors that can be based
// based on the request
function getPaymentLinksSession (req) {
  const key = 'createPaymentLink'
  return lodash.get(req, `session.pageData.${key}`)
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
  getPaymentLinksSession,
  metadata: {
    addMetadata,
    updateMetadata,
    removeMetadata
  }
}
