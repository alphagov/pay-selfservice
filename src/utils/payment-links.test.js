const { expect } = require('chai')

const paths = require('../paths')
const { getPaymentLinksContext, metadata } = require('./payment-links')

function getMockRequest (mockPaymentLinkSession = {}) {
  return {
    route: {
      path: '/create-payment-link/review'
    },
    session: {
      pageData: {
        createPaymentLink: mockPaymentLinkSession
      }
    }
  }
}

describe('payment links helper methods', () => {
  describe('payment link session context', () => {
    it('gets the current context for payment links session', () => {
      const mockPaymentLinkSession = {}
      const mockRequest = getMockRequest(mockPaymentLinkSession)
      const result = getPaymentLinksContext(mockRequest)
      expect(result.sessionData).to.equal(mockPaymentLinkSession)
    })

    it('correctly gets nothing if there is no payment links session', () => {
      const mockRequest = { route: { path: '/create-payment-link/review' } }
      const result = getPaymentLinksContext(mockRequest)
      expect(result.sessionData).to.be.undefined // eslint-disable-line
    })

    it('correctly flags context as creating payment link if not in manage list', () => {
      const mockRequest = { route: { path: paths.account.paymentLinks.review } }
      const result = getPaymentLinksContext(mockRequest)
      expect(result.isCreatingPaymentLink).to.be.true // eslint-disable-line
      expect(result.listMetadataPageUrl).to.include(paths.account.paymentLinks.review)
      expect(result.addMetadataPageUrl).to.include(paths.account.paymentLinks.addMetadata)
    })

    it('correctly flags context as managing payment link if in manage link and interpolates relevant product id', () => {
      const mockRequest = {
        route: { path: paths.account.paymentLinks.manage.edit },
        params: { productExternalId: 'an-external-id' }
      }
      const result = getPaymentLinksContext(mockRequest)
      expect(result.isCreatingPaymentLink).to.be.false // eslint-disable-line
      expect(result.listMetadataPageUrl).to.include('/create-payment-link/manage/edit/an-external-id')
      expect(result.addMetadataPageUrl).to.include('/create-payment-link/manage/an-external-id/add-reporting-column')
    })
  })

  describe('metadata helper methods', () => {
    it('updates session to add a new metadata correctly', () => {
      const mockPaymentLinkSession = {}
      metadata.addMetadata(mockPaymentLinkSession, 'key', 'a-value')
      expect(mockPaymentLinkSession.metadata.key).to.equal('a-value')
    })
    it('updates session replacing a metadata value if the key exists', () => {
      const mockPaymentLinkSession = {
        metadata: {
          key: 'a-value'
        }
      }
      metadata.addMetadata(mockPaymentLinkSession, 'key', 'second-value')
      expect(mockPaymentLinkSession.metadata.key).to.equal('second-value')
    })
  })

  it('updates session removing a metadata key if it exists', () => {
    const mockPaymentLinkSession = {
      metadata: {
        key: 'a-value'
      }
    }
    metadata.removeMetadata(mockPaymentLinkSession, 'key')
    expect(mockPaymentLinkSession.metadata['key']).to.be.undefined // eslint-disable-line
  })

  it('updates session to consistently replace a metadata key if the same key is used', () => {
    const mockPaymentLinkSession = {
      metadata: {
        key: 'a-value'
      }
    }
    metadata.updateMetadata(mockPaymentLinkSession, 'key', 'key', 'second-value')
    expect(mockPaymentLinkSession.metadata.key).to.equal('second-value')
  })

  it('updates session to consistently replace a metadata key if a new key is used', () => {
    const mockPaymentLinkSession = {
      metadata: {
        key: 'a-value'
      }
    }
    metadata.updateMetadata(mockPaymentLinkSession, 'key', 'updated-key', 'second-value')
    expect(mockPaymentLinkSession.metadata['key']).to.be.undefined // eslint-disable-line
    expect(mockPaymentLinkSession.metadata['updated-key']).to.equal('second-value')
  })
})
