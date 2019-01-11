'use strict'

const response = require('../../utils/response')

const supportedPolicyDocuments = require('./supportedPolicyDocuments')

// split into
// 1. supportedPolicyDocuments.js - index and list of supported
// 2. signedResources.js -> generate() - get a URL
// 3. index controller (this)

// aws key referes to the linked res

const downloadDocumentsPolicyPage = async function downloadDocumentsPolicyPage (req, res, next) {
  // @TODO(sfount) move to documents.lookup when moving to file

  try {
    const key = req.params.key
    const document = supportedPolicyDocuments.lookup(key)

    if (!document) {
      throw new Error(`Policy document ${key} is not supported or configured correctly`)
    }

    return response.response(req, res, document.template, {})
  } catch (error) {
    // @FIXME(sfount) next errors print a stack trace - this shouldn't ship to master with the current self service setup
    next(error)
  }
}

module.exports = downloadDocumentsPolicyPage
