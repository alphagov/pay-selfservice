'use strict'

const path = require('path')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const { Pact } = require('@pact-foundation/pact')
const expect = chai.expect
chai.should()
chai.use(chaiAsPromised)

const PactInteractionBuilder = require('../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const worldpay3dsFlexCredentialsFixtures = require('../../../fixtures/worldpay-3ds-flex-credentials.fixtures')
const Connector = require('../../../../app/services/clients/connector.client').ConnectorClient
const PORT = Math.floor(Math.random() * 48127) + 1024
const connectorClient = new Connector(`http://localhost:${PORT}`)
const ACCOUNTS_RESOURCE = '/v1/api/accounts'
const EXISTING_GATEWAY_ACCOUNT_ID = 333
const CHECK_WORLDPAY_3DS_FLEX_CREDENTIALS = 'worldpay/check-3ds-flex-config'

describe('connector client - check Worldpay 3DS Flex credentials', () => {
  const provider = new Pact({
    consumer: 'selfservice',
    provider: 'connector',
    port: PORT,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  afterEach(() => provider.verify())
  after(() => provider.finalize())

  describe('when a request to check Worldpay 3DS Flex credentials is made', () => {
    describe('and the credentials are valid and pass the existing format validation', () => {
      const checkValidWorldpay3dsFlexCredentialsRequest = worldpay3dsFlexCredentialsFixtures.checkValidWorldpay3dsFlexCredentialsRequest()
      const checkValidWorldpay3dsFlexCredentialsResponse = worldpay3dsFlexCredentialsFixtures.checkValidWorldpay3dsFlexCredentialsResponse()
      before(() => {
        const pactifiedRequest = checkValidWorldpay3dsFlexCredentialsRequest.getPactified()
        const pactifiedResponse = checkValidWorldpay3dsFlexCredentialsResponse.getPactified()

        provider.addInteraction(
          new PactInteractionBuilder(`${ACCOUNTS_RESOURCE}/${EXISTING_GATEWAY_ACCOUNT_ID}/${CHECK_WORLDPAY_3DS_FLEX_CREDENTIALS}`)
            .withState(`a gateway account ${EXISTING_GATEWAY_ACCOUNT_ID} with Worldpay 3DS Flex credentials exists`)
            .withUponReceiving('a request to check Worldpay 3DS Flex credentials')
            .withMethod('POST')
            .withRequestHeaders({ 'Content-Type': 'application/json' })
            .withRequestBody(pactifiedRequest.payload)
            .withStatusCode(200)
            .withResponseHeaders({ 'Content-Type': 'application/json' })
            .withResponseBody(pactifiedResponse)
            .build()
        )
      })

      it('should return valid', () => {
        const valid3dsFlexCredentials = checkValidWorldpay3dsFlexCredentialsRequest.getPlain()
        const validResult = checkValidWorldpay3dsFlexCredentialsResponse.getPlain()
        return connectorClient.postCheckWorldpay3dsFlexCredentials(valid3dsFlexCredentials)
          .should.be.fulfilled.then((response) => {
            expect(response).to.deep.equal(validResult)
          })
      })
    })
  })
})
