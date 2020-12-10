const { expect } = require('chai')
const { getPaymentLinksContext, metadata } = require('./payment-links')

function getMockRequest (mockPaymentLinkSession = {}) {
  return {
    originalUrl: '/create-payment-link/review',
    session: {
      pageData: {
        createPaymentLink: mockPaymentLinkSession
      }
    }
  }
}

describe('payment links helper methods', () => {
  describe('payment link sessions', () => {
    it('gets the current session for payment links', () => {
      const mockPaymentLinkSession = {}
      const mockRequest = getMockRequest(mockPaymentLinkSession)
      const result = getPaymentLinksContext(mockRequest).sessionData
      expect(result).to.equal(mockPaymentLinkSession)
    })

    it('correctly gets nothing if there is no payment links session', () => {
      const mockRequest = { originalUrl: '/create-payment-link/review' }
      const result = getPaymentLinksContext(mockRequest).sessionData
      expect(result).to.be.undefined // eslint-disable-line
    })
  })

  describe('metadata helper methods', () => {
    it('updates session to add a new metadata correctly', () => {
      const mockPaymentLinkSession = {}
      metadata.addMetadata(mockPaymentLinkSession, 'key', 'a-value')
      expect(mockPaymentLinkSession.metadata['key']).to.equal('a-value')
    })
    it('updates session replacing a metadata value if the key exists', () => {
      const mockPaymentLinkSession = {
        metadata: {
          key: 'a-value'
        }
      }
      metadata.addMetadata(mockPaymentLinkSession, 'key', 'second-value')
      expect(mockPaymentLinkSession.metadata['key']).to.equal('second-value')
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
    expect(mockPaymentLinkSession.metadata['key']).to.equal('second-value')
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
