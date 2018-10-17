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
    consumer: 'selfservice-to-be',
    provider: 'connector',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  after((done) => provider.finalize().then(done()))

  describe('get transaction details with delayed capture OFF', () => {
    const gatewayAccount = ssDefaultUser.gateway_accounts.filter(fil => fil.isPrimary === 'true')[0]
    const firstCharge = ssDefaultUser.sections.transactions.data[0]
    const chargeDetails = ssDefaultUser.sections.transactions.details_data.filter(x => x.charge_id === firstCharge.charge_id)[0]
    const params = {
      gatewayAccountId: gatewayAccount.id,
      chargeId: firstCharge.charge_id
    }
    const validGetTransactionDetailsResponse = transactionDetailsFixtures.validTransactionDetailsResponse(
      {
        summaryObject: firstCharge,
        payment_provider: gatewayAccount.name,
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
          .withUponReceiving('a valid transaction details request with delayed capture OFF')
          .withState(`User ${params.gatewayAccountId} exists in the database and has 5 transactions available`)
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

  describe('get transaction details with delayed capture ON', () => {
    const gatewayAccount = ssDefaultUser.gateway_accounts.filter(fil => fil.isPrimary === 'true')[0]
    const transactions = ssDefaultUser.sections.transactions
    const chargeWithDelayedCapture = transactions.data.filter(item => item.charge_id === '23456')[0]
    const chargeDetails = transactions.details_data.filter(x => x.charge_id === chargeWithDelayedCapture.charge_id)[0]
    const params = {
      gatewayAccountId: gatewayAccount.id,
      chargeId: chargeWithDelayedCapture.charge_id
    }
    const validGetTransactionDetailsResponse = transactionDetailsFixtures.validTransactionDetailsResponse(
      {
        summaryObject: chargeWithDelayedCapture,
        payment_provider: gatewayAccount.name,
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
          .withUponReceiving('a valid transaction details request with delayed capture ON')
          .withState(`User ${params.gatewayAccountId} exists in the database and has 5 transactions available`)
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

  describe('get transaction details with corporate card surcharge', () => {
    const gatewayAccount = ssDefaultUser.gateway_accounts.filter(fil => fil.isPrimary === 'true')[0]
    const transactions = ssDefaultUser.sections.transactions
    const corporateCardSurchargeCharge = transactions.data.filter(item => item.charge_id === '52345')[0]
    const chargeDetails = transactions.details_data.filter(x => x.charge_id === corporateCardSurchargeCharge.charge_id)[0]
    const params = {
      gatewayAccountId: gatewayAccount.id,
      chargeId: corporateCardSurchargeCharge.charge_id
    }
    const validGetTransactionDetailsResponse = transactionDetailsFixtures.validTransactionDetailsResponse(
      {
        summaryObject: corporateCardSurchargeCharge,
        payment_provider: gatewayAccount.name,
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
          .withUponReceiving('a valid transaction details request with corporate card surcharge')
          .withState(`User ${params.gatewayAccountId} exists in the database and has 5 transactions available`)
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

  describe('get failed refund transaction details', () => {
    // TODO : Added to support functionality added using browser testing. Could be a candidate for not being published to the pact broker

    const gatewayAccount = ssDefaultUser.gateway_accounts.filter(fil => fil.isPrimary === 'true')[0]
    const refundFailedCharge = ssDefaultUser.sections.transactions.data.filter(fil => fil.state.status === 'error')[0]
    const chargeDetails = ssDefaultUser.sections.transactions.details_data.filter(x => x.charge_id === refundFailedCharge.charge_id)[0]
    const params = {
      gatewayAccountId: gatewayAccount.id,
      chargeId: refundFailedCharge.charge_id
    }
    const validGetTransactionDetailsResponse = transactionDetailsFixtures.validTransactionDetailsResponse(
      {
        summaryObject: refundFailedCharge,
        payment_provider: gatewayAccount.name,
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
          .withUponReceiving('a valid failed refund transaction details request')
          .withState(`User ${params.gatewayAccountId} exists in the database and has 5 transactions available`)
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactified)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should get failed refund transaction details successfully', function (done) {
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

  describe('get charge events for delayed_capture on', () => {
    const firstCharge = ssDefaultUser.sections.transactions.data.filter(item => item.charge_id === '23456')[0]
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

    it('should get charge events successfully for delayed_capture on', function (done) {
      const getChargeEvents = validGetTransactionDetailsResponse.getPlain()
      connectorClient.getChargeEvents(params,
        (connectorData, connectorResponse) => {
          expect(connectorResponse.body).to.deep.equal(getChargeEvents)
          done()
        })
    })
  })

  describe('get charge events for corporate card surcharge', () => {
    const firstCharge = ssDefaultUser.sections.transactions.data.filter(item => item.charge_id === '52345')[0]
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

    it('should get charge events successfully for corporate card surcharge', function (done) {
      const getChargeEvents = validGetTransactionDetailsResponse.getPlain()
      connectorClient.getChargeEvents(params,
        (connectorData, connectorResponse) => {
          expect(connectorResponse.body).to.deep.equal(getChargeEvents)
          done()
        })
    })
  })

  describe('get failed refund charge events', () => {
    const failedRefundCharge = ssDefaultUser.sections.transactions.data.filter(fil => fil.state.status === 'error')[0]
    const chargeDetails = ssDefaultUser.sections.transactions.details_data.filter(x => x.charge_id === failedRefundCharge.charge_id)[0]
    const params = {
      gatewayAccountId: ssDefaultUser.gateway_accounts.filter(fil => fil.isPrimary === 'true')[0].id, // '666'
      chargeId: failedRefundCharge.charge_id
    }
    const validGetTransactionDetailsResponse = transactionDetailsFixtures.validChargeEventsResponse({
      chargeId: params.chargeId,
      events: chargeDetails.charge_events
    })

    before((done) => {
      const pactified = validGetTransactionDetailsResponse.getPactified()
      provider.addInteraction(
        new PactInteractionBuilder(`${CHARGES_RESOURCE}/${params.gatewayAccountId}/charges/${params.chargeId}/events`)
          .withUponReceiving('a valid failed refund charge events request')
          .withState(`User ${params.gatewayAccountId} exists in the database, has an available charge with id ${failedRefundCharge.charge_id} and has available charge events`)
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

  describe('post refund', () => {
    describe('success', () => {
      const failedRefundCharge = ssDefaultUser.sections.transactions.data.filter(fil => fil.state.status === 'error')[0]
      const chargeDetails = ssDefaultUser.sections.transactions.details_data.filter(x => x.charge_id === failedRefundCharge.charge_id)[0]
      const params = {
        chargeId: failedRefundCharge.charge_id,
        gatewayAccountId: ssDefaultUser.gateway_accounts.filter(fil => fil.isPrimary === 'true')[0].id,
        payload:
          {
            amount: chargeDetails.refund_summary.amount_available,
            refund_amount_available: chargeDetails.refund_summary.amount_available,
            user_external_id: ssDefaultUser.external_id
          }
      }
      const validPostRefundRequest = transactionDetailsFixtures.validTransactionRefundRequest(params)
      before((done) => {
        const pactified = validPostRefundRequest.getPactified()
        provider.addInteraction(
          new PactInteractionBuilder(`${CHARGES_RESOURCE}/${params.gatewayAccountId}/charges/${params.chargeId}/refunds`)
            .withUponReceiving('a valid post refund request')
            .withState(`User ${params.gatewayAccountId} exists in the database, has an available charge that failed a previous refund with id ${failedRefundCharge.charge_id}`)
            .withMethod('POST')
            .withRequestBody(pactified)
            .withStatusCode(202)
            .build()
        )
          .then(() => done())
          .catch(done)
      })

      afterEach(() => provider.verify())

      it('should post a refund request successfully for a previously failed refund', function (done) {
        connectorClient.postChargeRefund(
          params, () => {
            done()
          }
        )
      })
    })

    describe('failure', () => {
      const firstCharge = ssDefaultUser.sections.transactions.data[0]
      const chargeDetails = ssDefaultUser.sections.transactions.details_data.filter(x => x.charge_id === firstCharge.charge_id)[0]
      const params = {
        gatewayAccountId: ssDefaultUser.gateway_accounts.filter(fil => fil.isPrimary === 'true')[0].id, // '666'
        chargeId: firstCharge.charge_id,
        payload:
          {
            amount: chargeDetails.refund_summary.amount_available + 1, // 1 penny more than the available refund amount
            refund_amount_available: chargeDetails.refund_summary.amount_available,
            user_external_id: ssDefaultUser.external_id
          }
      }

      const invalidTransactionRefundRequest = transactionDetailsFixtures.invalidTransactionRefundRequest(params.payload)
      const invalidTransactionRefundResponse = transactionDetailsFixtures.invalidTransactionRefundResponse({reason: 'amount_not_available'})

      before((done) => {
        const pactifiedRequest = invalidTransactionRefundRequest.getPactified()
        const pactifiedResponse = invalidTransactionRefundResponse.getPactified()

        provider.addInteraction(
          new PactInteractionBuilder(`${CHARGES_RESOURCE}/${params.gatewayAccountId}/charges/${params.chargeId}/refunds`)
            .withUponReceiving('an invalid transaction refund request')
            .withState(`User ${params.gatewayAccountId} exists in the database, has an available charge with id ${firstCharge.charge_id}`)
            .withMethod('POST')
            .withRequestBody(pactifiedRequest)
            .withStatusCode(400)
            .withResponseBody(pactifiedResponse)
            .build()
        ).then(() => done())
          .catch(done)
      })

      afterEach(() => provider.verify())

      it('should fail with a refund amount greater than the refund amount available', function (done) {
        const refundFailureResponse = invalidTransactionRefundResponse.getPlain()
        connectorClient.postChargeRefund(params,
          () => {
            done('refund success callback should not be executed')
          }).on('connectorError', (err, response) => {
          if (err) { return done(err) }
          expect(response.statusCode).to.equal(400)
          expect(response.body).to.deep.equal(refundFailureResponse)
          done()
        })
      })
    })
  })
})
