'use strict'

const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const path = require('path')
const PactInteractionBuilder = require('../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const Connector = require('../../../../app/services/clients/connector.client').ConnectorClient
const cardFixtures = require('../../../fixtures/card.fixtures')
const { pactify } = require('../../../test-helpers/pact/pactifier').defaultPactifier

// Constants
const CARD_TYPES_RESOURCE = '/v1/api/card-types'
const port = Math.floor(Math.random() * 48127) + 1024
const connectorClient = new Connector(`http://localhost:${port}`)
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

describe('connector client', function () {
  const provider = new Pact({
    consumer: 'selfservice-to-be',
    provider: 'connector',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  after(() => provider.finalize())

  describe('get card types', () => {
    const validCardTypesResponse = cardFixtures.validCardTypesResponse()

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${CARD_TYPES_RESOURCE}`)
          .withUponReceiving('a valid card types request')
          .withState('Card types exist in the database')
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactify(validCardTypesResponse))
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should get card types successfully', function (done) {
      const getCardTypes = validCardTypesResponse
      connectorClient.getAllCardTypes().then(response => {
        expect(response).to.deep.equal(getCardTypes)
        done()
      })
    })
  })
})
