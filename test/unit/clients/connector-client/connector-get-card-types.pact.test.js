'use strict'

const { Pact } = require('@pact-foundation/pact')

const path = require('path')
const PactInteractionBuilder = require('../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const Connector = require('../../../../app/services/clients/connector.client').ConnectorClient
const cardFixtures = require('../../../fixtures/card.fixtures')

// Constants
const CARD_TYPES_RESOURCE = '/v1/api/card-types'
const port = Math.floor(Math.random() * 48127) + 1024
const connectorClient = new Connector(`http://localhost:${port}`)

// Global setup

describe('connector client', () => {
  const provider = new Pact({
    consumer: 'selfservice-to-be',
    provider: 'connector',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  beforeAll(() => provider.setup())
  afterAll(() => provider.finalize())

  describe('get card types', () => {
    const validCardTypesResponse = cardFixtures.validCardTypesResponse()

    beforeAll((done) => {
      const pactified = validCardTypesResponse.getPactified()
      provider.addInteraction(
        new PactInteractionBuilder(`${CARD_TYPES_RESOURCE}`)
          .withUponReceiving('a valid card types request')
          .withState('Card types exist in the database')
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactified)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should get card types successfully', done => {
      const getCardTypes = validCardTypesResponse.getPlain()
      connectorClient.getAllCardTypes((connectorData, connectorResponse) => {
        expect(connectorResponse.body).toEqual(getCardTypes)
        done()
      })
    })
  })
})
