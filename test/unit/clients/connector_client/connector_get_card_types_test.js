'use strict'

// NPM dependencies
const Pact = require('pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Custom dependencies
const path = require('path')
const PactInteractionBuilder = require('../../../fixtures/pact_interaction_builder').PactInteractionBuilder
const Connector = require('../../../../app/services/clients/connector_client').ConnectorClient
const cardFixtures = require('../../../fixtures/card_fixtures')

// Constants
const CARD_TYPES_RESOURCE = '/v1/api/card-types'
const port = Math.floor(Math.random() * 48127) + 1024
const connectorClient = new Connector(`http://localhost:${port}`)
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

describe('connector client', function () {
  const provider = Pact({
    consumer: 'selfservice',
    provider: 'connector',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  after((done) => provider.finalize().then(done()))

  describe('get card types', () => {
    const validCardTypesResponse = cardFixtures.validCardTypesResponse()

    before((done) => {
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

    it('should get card types successfully', function (done) {
      const getCardTypes = validCardTypesResponse.getPlain()
      connectorClient.getAllCardTypes((connectorData, connectorResponse) => {
        expect(connectorResponse.body).to.deep.equal(getCardTypes)
        done()
      })
    })
  })
})
