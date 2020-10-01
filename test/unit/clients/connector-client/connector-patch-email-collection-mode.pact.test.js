'use strict'

const { Pact } = require('@pact-foundation/pact')
const { expect } = require('chai')

const path = require('path')
const PactInteractionBuilder = require('../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const Connector = require('../../../../app/services/clients/connector.client').ConnectorClient
const gatewayAccountFixtures = require('../../../fixtures/gateway-account.fixtures')

// Constants
const ACCOUNTS_RESOURCE = '/v1/api/accounts'
const port = Math.floor(Math.random() * 48127) + 1024
const connectorClient = new Connector(`http://localhost:${port}`)

// Global setup

const existingGatewayAccountId = 42
const defaultState = `Gateway account ${existingGatewayAccountId} exists in the database`

describe('connector client - patch email collection mode', function () {
  let provider = new Pact({
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

  describe('patch email collection mode - mandatory', () => {
    const validGatewayAccountEmailCollectionModeRequest =
      gatewayAccountFixtures.validGatewayAccountEmailCollectionModeRequest('MANDATORY')

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${ACCOUNTS_RESOURCE}/${existingGatewayAccountId}`)
          .withUponReceiving('a valid patch email collection mode (mandatory) request')
          .withState(defaultState)
          .withMethod('PATCH')
          .withRequestBody(validGatewayAccountEmailCollectionModeRequest.getPactified())
          .withStatusCode(200)
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should set email collection mode to mandatory', function (done) {
      const params = {
        gatewayAccountId: existingGatewayAccountId,
        payload: validGatewayAccountEmailCollectionModeRequest.getPlain()
      }
      connectorClient.updateEmailCollectionMode(params, (connectorData, connectorResponse) => {
        expect(connectorResponse.statusCode).to.equal(200)
        done()
      })
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
          .withRequestBody(validGatewayAccountEmailCollectionModeRequest.getPactified())
          .withStatusCode(200)
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should set email collection mode to optional', function (done) {
      const params = {
        gatewayAccountId: existingGatewayAccountId,
        payload: validGatewayAccountEmailCollectionModeRequest.getPlain()
      }
      connectorClient.updateEmailCollectionMode(params, (connectorData, connectorResponse) => {
        expect(connectorResponse.statusCode).to.equal(200)
        done()
      })
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
          .withRequestBody(validGatewayAccountEmailCollectionModeRequest.getPactified())
          .withStatusCode(200)
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should set email collection mode to mandatory', function (done) {
      const params = {
        gatewayAccountId: existingGatewayAccountId,
        payload: validGatewayAccountEmailCollectionModeRequest.getPlain()
      }
      connectorClient.updateEmailCollectionMode(params, (connectorData, connectorResponse) => {
        expect(connectorResponse.statusCode).to.equal(200)
        done()
      })
    })
  })
})
