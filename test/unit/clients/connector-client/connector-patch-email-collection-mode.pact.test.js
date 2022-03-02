'use strict'

const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const path = require('path')
const PactInteractionBuilder = require('../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const Connector = require('../../../../app/services/clients/connector.client').ConnectorClient
const gatewayAccountFixtures = require('../../../fixtures/gateway-account.fixtures')

// Constants
const ACCOUNTS_RESOURCE = '/v1/api/accounts'
let connectorClient
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

const existingGatewayAccountId = 42
const defaultState = `Gateway account ${existingGatewayAccountId} exists in the database`

describe('connector client - patch email collection mode', function () {
  const provider = new Pact({
    consumer: 'selfservice-to-be',
    provider: 'connector',
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(async () => {
    const opts = await provider.setup()
    connectorClient = new Connector(`http://localhost:${opts.port}`)
  })
  after(() => provider.finalize())

  describe('patch email collection mode - mandatory', () => {
    const validGatewayAccountEmailCollectionModeRequest =
      gatewayAccountFixtures.validGatewayAccountEmailCollectionModeRequest('MANDATORY')

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${ACCOUNTS_RESOURCE}/${existingGatewayAccountId}`)
          .withUponReceiving('a valid patch email collection mode (mandatory) request')
          .withState(defaultState)
          .withMethod('PATCH')
          .withRequestBody(validGatewayAccountEmailCollectionModeRequest)
          .withStatusCode(200)
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should set email collection mode to mandatory', function () {
      const params = {
        gatewayAccountId: existingGatewayAccountId,
        payload: validGatewayAccountEmailCollectionModeRequest
      }
      return expect(connectorClient.updateEmailCollectionMode(params)).to.be.fulfilled
    })
  })

  describe('patch email collection mode - optional', () => {
    const validGatewayAccountEmailCollectionModeRequest =
      gatewayAccountFixtures.validGatewayAccountEmailCollectionModeRequest('OPTIONAL')

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${ACCOUNTS_RESOURCE}/${existingGatewayAccountId}`)
          .withUponReceiving('a valid patch email collection mode (optional) request')
          .withState(defaultState)
          .withMethod('PATCH')
          .withRequestBody(validGatewayAccountEmailCollectionModeRequest)
          .withStatusCode(200)
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should set email collection mode to optional', function () {
      const params = {
        gatewayAccountId: existingGatewayAccountId,
        payload: validGatewayAccountEmailCollectionModeRequest
      }
      return expect(connectorClient.updateEmailCollectionMode(params)).to.be.fulfilled
    })
  })

  describe('patch email collection mode - off', () => {
    const validGatewayAccountEmailCollectionModeRequest =
      gatewayAccountFixtures.validGatewayAccountEmailCollectionModeRequest('OFF')

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${ACCOUNTS_RESOURCE}/${existingGatewayAccountId}`)
          .withUponReceiving('a valid patch email collection mode (off) request')
          .withState(`Gateway account ${existingGatewayAccountId} exists in the database`)
          .withMethod('PATCH')
          .withRequestBody(validGatewayAccountEmailCollectionModeRequest)
          .withStatusCode(200)
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should set email collection mode to mandatory', function () {
      const params = {
        gatewayAccountId: existingGatewayAccountId,
        payload: validGatewayAccountEmailCollectionModeRequest
      }
      return expect(connectorClient.updateEmailCollectionMode(params)).to.be.fulfilled
    })
  })
})
