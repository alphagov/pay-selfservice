'use strict'

// supported document keys convention links the self service URL /policy/download/:key
// and AWS S3 Bucket document ids (:key)
const supportedPolicyDocuments = [
  {
    key: 'memorandum-of-understanding-for-crown-bodies',
    title: 'Pay memorandum of understanding',
    template: 'policy/document/memorandum-of-understanding-for-crown-bodies'
  },
  {
    key: 'contract-for-non-crown-bodies',
    title: 'Pay contract',
    template: 'policy/document/contract-for-non-crown-bodies'
  },
  {
    key: 'stripe-connected-account-agreement',
    title: 'Stripe Connected Account Agreement',
    template: 'policy/document/stripe-connected-account-agreement'
  },
  {
    key: 'pci-dss-attestation-of-compliance',
    title: 'Attestation of Compliance for PCI',
    template: 'policy/document/pci-dss-attestation-of-compliance'
  },
  {
    key: 'memorandum-of-understanding-for-crown-bodies-2022',
    title: 'Pay memorandum of understanding from 24 January 2022',
    template: 'policy/document/v2/memorandum-of-understanding-for-crown-bodies'
  },
  {
    key: 'contract-for-non-crown-bodies-2022',
    title: 'Pay contract from 24 January 2022',
    template: 'policy/document/v2/contract-for-non-crown-bodies'
  },
  {
    key: 'stripe-connected-account-agreement-2022',
    title: 'Stripe Connected Account Agreement from 24 January 2022',
    template: 'policy/document/v2/stripe-connected-account-agreement'
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
