'use strict'

const path = require('path')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const { Pact } = require('@pact-foundation/pact')
const expect = chai.expect
chai.should()
chai.use(chaiAsPromised)

const PactInteractionBuilder = require('../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const worldpay3dsFlexCredentialsFixtures = require('../../fixtures/worldpay-3ds-flex-credentials.fixtures')
const Connector = require('../../../app/services/clients/connector.client').ConnectorClient
const { pactify } = require('../../test-helpers/pact/pactifier').defaultPactifier

let connectorClient
const ACCOUNTS_RESOURCE = '/v1/api/accounts'
const EXISTING_GATEWAY_ACCOUNT_ID = 333
const CHECK_WORLDPAY_3DS_FLEX_CREDENTIALS = 'worldpay/check-3ds-flex-config'

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

  describe('when a request to check Worldpay 3DS Flex credentials is made', () => {
    describe('and the credentials are valid and pass the existing format validation', () => {
      const checkValidWorldpay3dsFlexCredentialsRequest = worldpay3dsFlexCredentialsFixtures.checkValidWorldpay3dsFlexCredentialsRequest()
      const checkValidWorldpay3dsFlexCredentialsResponse = worldpay3dsFlexCredentialsFixtures.checkValidWorldpay3dsFlexCredentialsResponse()
      before(() => {
        return provider.addInteraction(
          new PactInteractionBuilder(`${ACCOUNTS_RESOURCE}/${EXISTING_GATEWAY_ACCOUNT_ID}/${CHECK_WORLDPAY_3DS_FLEX_CREDENTIALS}`)
            .withState(`a gateway account ${EXISTING_GATEWAY_ACCOUNT_ID} with Worldpay 3DS Flex credentials exists`)
            .withUponReceiving('a request to check Worldpay 3DS Flex credentials')
            .withMethod('POST')
            .withRequestHeaders({ 'Content-Type': 'application/json' })
            .withRequestBody(checkValidWorldpay3dsFlexCredentialsRequest.payload)
            .withStatusCode(200)
            .withResponseHeaders({ 'Content-Type': 'application/json' })
            .withResponseBody(pactify(checkValidWorldpay3dsFlexCredentialsResponse))
            .build()
        )
      })

      it('should return valid', async () => {
        const response = await connectorClient.postCheckWorldpay3dsFlexCredentials(checkValidWorldpay3dsFlexCredentialsRequest)
        expect(response).to.deep.equal(checkValidWorldpay3dsFlexCredentialsResponse)
      })
    })
  })
})
