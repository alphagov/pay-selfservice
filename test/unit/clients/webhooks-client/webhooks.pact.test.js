'use strict'

const path = require('path')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const { Pact } = require('@pact-foundation/pact')

const PactInteractionBuilder = require('../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const { pactify } = require('../../../test-helpers/pact/pactifier').defaultPactifier
const webhookFixtures = require('../../../fixtures/webhooks.fixtures')
const webhooksClient = require('../../../../app/services/clients/webhooks.client')

const { expect } = chai
chai.use(chaiAsPromised)

const provider = new Pact({
  consumer: 'selfservice',
  provider: 'webhooks',
  log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
  dir: path.resolve(process.cwd(), 'pacts'),
  spec: 2,
  pactfileWriteMode: 'merge'
})

const serviceId = 'an-external-service-id'
const isLive = true
const webhookId = 'an-external-webhook-id'

describe('webhooks client', function () {
  let webhooksUrl

  before(async () => {
    const opts = await provider.setup()
    webhooksUrl = `http://localhost:${opts.port}`
  })
  after(() => provider.finalize())

  describe('list webhooks', () => {
    before(() => {
      return provider.addInteraction(
        new PactInteractionBuilder(`/v1/webhooks`)
          .withQuery('service_id', serviceId)
          .withQuery('live', isLive.toString())
          .withUponReceiving('a valid list webhooks for service request')
          .withState('webhooks exist for given service id')
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactify(webhookFixtures.webhooksListResponse([{ external_id: webhookId }])))
          .build()
      )
    })

    afterEach(() => provider.verify())

    it('should get list of webhooks for a given service', () => {
      return webhooksClient.webhooks(serviceId, isLive, { baseUrl: webhooksUrl })
        .then((response) => {
          // asserts that the client has correctly formatted the request to match the stubbed fixture provider
          expect(response[0].external_id).to.equal(webhookId)
        })
    })
  })
})
