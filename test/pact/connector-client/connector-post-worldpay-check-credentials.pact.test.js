'use strict'

const path = require('path')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const { Pact } = require('@pact-foundation/pact')
const expect = chai.expect
chai.should()
chai.use(chaiAsPromised)

const PactInteractionBuilder = require('../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const worldpayCredentialsFixtures = require('../../fixtures/worldpay-credentials.fixtures')
const Connector = require('../../../app/services/clients/connector.client').ConnectorClient
const { pactify } = require('../../test-helpers/pact/pactifier').defaultPactifier

let connectorClient
const EXISTING_GATEWAY_ACCOUNT_ID = 333

describe('connector client - check Worldpay 3DS Flex credentials', () => {
  const provider = new Pact({
    consumer: 'selfservice',
    provider: 'connector',
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(async () => {
    const opts = await provider.setup()
    connectorClient = new Connector(`http://127.0.0.1:${opts.port}`)
  })
  afterEach(() => provider.verify())
  after(() => provider.finalize())

  describe('when a request to check Worldpay credentials is made', () => {
    describe('and the credentials are valid and pass the existing format validation', () => {
      const checkValidWorldpayCredentialsRequest = worldpayCredentialsFixtures.checkValidWorldpayCredentialsRequest()
      const checkValidWorldpayCredentialsResponse = worldpayCredentialsFixtures.checkValidWorldpayCredentialsResponse()
      before(() => {
        return provider.addInteraction(
          new PactInteractionBuilder(`/v1/api/accounts/${EXISTING_GATEWAY_ACCOUNT_ID}/worldpay/check-credentials`)
            .withState(`a Worldpay gateway account with id ${EXISTING_GATEWAY_ACCOUNT_ID} exists and stub for validating credentials is set up`)
            .withUponReceiving('a request to check Worldpay credentials')
            .withMethod('POST')
            .withRequestHeaders({ 'Content-Type': 'application/json' })
            .withRequestBody(checkValidWorldpayCredentialsRequest.payload)
            .withStatusCode(200)
            .withResponseHeaders({ 'Content-Type': 'application/json' })
            .withResponseBody(pactify(checkValidWorldpayCredentialsResponse))
            .build()
        )
      })

      it('should return valid', () => {
        return connectorClient.postCheckWorldpayCredentials(checkValidWorldpayCredentialsRequest)
          .should.be.fulfilled.then((response) => {
            expect(response).to.deep.equal(checkValidWorldpayCredentialsResponse)
          })
      })
    })
  })
})
