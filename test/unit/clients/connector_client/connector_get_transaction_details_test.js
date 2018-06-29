'use strict'

// NPM dependencies
const Pact = require('pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Custom dependencies
const path = require('path')
const PactInteractionBuilder = require('../../../fixtures/pact_interaction_builder').PactInteractionBuilder
const Connector = require('../../../../app/services/clients/connector_client').ConnectorClient
const transactionDetailsFixtures = require('../../../fixtures/transaction_fixtures')

// Constants
const CHARGES_RESOURCE = '/v1/api/accounts'
const port = Math.floor(Math.random() * 48127) + 1024
const connectorClient = new Connector(`http://localhost:${port}`)
const expect = chai.expect

// Note: the browser tests use values in the fixed config below, which match the defined interations
const ssUserConfig = require('../../../fixtures/config/self_service_user.json')
const ssDefaultUser = ssUserConfig.config.users.filter(fil => fil.isPrimary === 'true')[0]

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

  describe('get transaction details', () => {

    const firstCharge = ssDefaultUser.sections.transactions.data[0]
    const chargeDetails = ssDefaultUser.sections.transactions.details_data.filter(x => x.charge_id === firstCharge.charge_id)[0]
    const params = {
      gatewayAccountId: ssDefaultUser.gateway_accounts.filter(fil => fil.isPrimary === 'true')[0].id, // '666'
      chargeId: firstCharge.charge_id
    }
    const validGetTransactionDetailsResponse = transactionDetailsFixtures.validTransactionDetailsResponse(
      {
        summaryObject: firstCharge,
        gateway_account_id: params.gatewayAccountId,
        refund_summary: chargeDetails.refund_summary,
        settlement_summary: chargeDetails.settlement_summary,
        billing_address: chargeDetails.billing_address
      }
    )

    before((done) => {
      const pactified = validGetTransactionDetailsResponse.getPactified()
      provider.addInteraction(
        new PactInteractionBuilder(`${CHARGES_RESOURCE}/${params.gatewayAccountId}/charges/${params.chargeId}`)
          .withUponReceiving('a valid transaction details request')
          .withState(`User ${params.gatewayAccountId} exists in the database and has 4 transactions available`)
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactified)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should get transaction details successfully', function (done) {
      const getTransactionDetails = validGetTransactionDetailsResponse.getPlain()
      connectorClient.getCharge(params,
        (connectorData, connectorResponse) => {
          expect(connectorResponse.body).to.deep.equal(getTransactionDetails)
          done()
        })
    })
  })

  describe('get charge events', () => {

    const firstCharge = ssDefaultUser.sections.transactions.data[0]
    const chargeDetails = ssDefaultUser.sections.transactions.details_data.filter(x => x.charge_id === firstCharge.charge_id)[0]
    const params = {
      gatewayAccountId: ssDefaultUser.gateway_accounts.filter(fil => fil.isPrimary === 'true')[0].id, // '666'
      chargeId: firstCharge.charge_id
    }
    const validGetTransactionDetailsResponse = transactionDetailsFixtures.validChargeEventsResponse({
      chargeId: params.chargeId,
      events: chargeDetails.charge_events
    })

    before((done) => {
      const pactified = validGetTransactionDetailsResponse.getPactified()
      provider.addInteraction(
        new PactInteractionBuilder(`${CHARGES_RESOURCE}/${params.gatewayAccountId}/charges/${params.chargeId}/events`)
          .withUponReceiving('a valid charge events request')
          .withState(`User ${params.gatewayAccountId} exists in the database, has an available charge with id ${firstCharge.charge_id} and has available charge events`)
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactified)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should get charge events successfully', function (done) {
      const getChargeEvents = validGetTransactionDetailsResponse.getPlain()
      connectorClient.getChargeEvents(params,
        (connectorData, connectorResponse) => {
          expect(connectorResponse.body).to.deep.equal(getChargeEvents)
          done()
        })
    })
  })
})
