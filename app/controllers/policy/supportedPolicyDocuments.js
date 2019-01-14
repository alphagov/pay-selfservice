'use strict'

// supported document keys convention links the self service URL /policy/download/:key
// and AWS S3 Bucket document ids (:key)
const supportedPolicyDocuments = [
  {
    key: 'memorandum-of-understanding-for-crown-bodies',
    template: 'policy/document-downloads/memorandum_of_understanding_for_crown_bodies'
  },
  {
    key: 'contract-for-non-crown-bodies',
    template: 'policy/document-downloads/contract_for_non_crown_bodies'
  },
  {
    key: 'stripe-connected-account-agreement',
    template: 'policy/document-downloads/stripe_connected_account_agreement'
  }
]

const supportedPolicyDocumentsKeyIndex = supportedPolicyDocuments.reduce((index, policyDocument) => {
  index[policyDocument.key] = policyDocument
  return index
}, {})

const lookup = async function lookup (key) {
  const document = supportedPolicyDocumentsKeyIndex[key]

  if (!document) {
    throw new Error(`Policy document ${key} is not supported or configured correctly`)
  }
  return document
}

module.exports = { lookup }
