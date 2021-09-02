'use strict'

// supported document keys convention links the self service URL /policy/download/:key
// and AWS S3 Bucket document ids (:key)
const supportedPolicyDocuments = [
  {
    key: 'memorandum-of-understanding-for-crown-bodies',
    title: 'Pay memorandum of understanding',
    template: 'policy/document-downloads/memorandum-of-understanding-for-crown-bodies',
    htmlTemplate: 'policy/document-html/memorandum-of-understanding-for-crown-bodies'
  },
  {
    key: 'contract-for-non-crown-bodies',
    title: 'Pay contract',
    template: 'policy/document-downloads/contract-for-non-crown-bodies',
    htmlTemplate: 'policy/document-html/contract-for-non-crown-bodies'
  },
  {
    key: 'stripe-connected-account-agreement',
    title: 'Stripe Connected Account Agreement',
    template: 'policy/document-downloads/stripe-connected-account-agreement',
    htmlTemplate: 'policy/document-html/stripe-connected-account-agreement'
  },
  {
    key: 'pci-dss-attestation-of-compliance',
    title: 'Attestation of Compliance for PCI',
    template: 'policy/document-downloads/pci-dss-attestation-of-compliance',
    htmlTemplate: 'policy/document-html/pci-dss-attestation-of-compliance'
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
