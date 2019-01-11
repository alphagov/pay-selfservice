'use strict'

const supportedPolicyDocuments = [
  {
    key: 'memorandum-of-understanding-for-crown-bodies',
    awsKey: 'memorandum-of-understanding',
    template: 'policy/document-downloads/memorandum_of_understanding_for_crown_bodies'
  },
  {
    key: 'contract-for-non-crown-bodies',
    awsKey: 'context-for-non-crown-bodies',
    template: 'policy/document-downloads/contract_for_non_crown_bodies'
  },
  {
    key: 'stripe-connected-account-agreement',
    awsKey: 'stripe-connected-account-agreement',
    template: 'policy/document-downloads/stripe_connected_account_agreement'
  }
]

const supportedPolicyDocumentsKeyIndex = supportedPolicyDocuments.reduce((index, policyDocument) => {
  index[policyDocument.key] = policyDocument
  return index
}, {})

const lookup = function lookup (key) {
  return supportedPolicyDocumentsKeyIndex[key]
}

module.exports = { lookup }
