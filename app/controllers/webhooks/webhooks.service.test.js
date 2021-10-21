const { expect } = require('chai')

const proxyquire = require('proxyquire')

const webhooksFixture = require('./../../../test/fixtures/webhooks.fixtures')

describe('webhooks service', () => {
  describe('list webhooks', () => {
    it('should order webhooks with active webhooks first', async () => {
      const webhooks = webhooksFixture.webhooksListResponse([
        { external_id: 1, status: 'INACTIVE' },
        { external_id: 2, status: 'ACTIVE' },
        { external_id: 3, status: 'INACTIVE' },
        { external_id: 4, status: 'INACTIVE' },
        { external_id: 5, status: 'ACTIVE' }
      ])
      const service = getWebhooksService(webhooks)
      const result = await service.listWebhooks('some-service-id', true)
      expect(result.map(webhook => webhook.external_id)).to.deep.equal([ 2, 5, 1, 3, 4 ])
    })
  })
})

function getWebhooksService(listWebhooksResponseStub = []) {
  const webhooksService = proxyquire('./webhooks.service.js', {
    './../../services/clients/webhooks.client': {
      webhooks: async (serviceId, isLive) => listWebhooksResponseStub
    }
  })
  return webhooksService
}