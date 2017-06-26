'use strict'

// NPM dependencies
const Pact = require('pact');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

// Custom dependencies
const pactProxy = require('../../../test_helpers/pact_proxy');
const Connector     = require('../../../../app/services/clients/connector_client').ConnectorClient;
const PactInteractionBuilder = require('../../../fixtures/pact_interaction_builder').PactInteractionBuilder;
const gatewayAccountFixtures = require('../../../fixtures/gateway_account_fixtures');

// Constants
const ACCOUNTS_RESOURCE = '/v1/api/accounts';
const mockPort = Math.floor(Math.random() * 65535);
const mockServer = pactProxy.create('localhost', mockPort);
const connectorClient = new Connector(`http://localhost:${mockPort}`);

// Global setup
chai.use(chaiAsPromised);
const expect = chai.expect;

describe('connector client - create gateway account', function () {

  let connectorMock;

  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000);
    mockServer.start().then(function () {
      connectorMock = Pact({consumer: 'Connector-create-gateway-account', provider: 'Connector', port: mockPort});
      done();
    });
  });

  /**
   * Remove the server and publish pacts to broker
   */
  after(function (done) {
    mockServer.delete()
      .then(() => pactProxy.removeAll())
      .then(() => done());
  });

  describe('create gateway account', function () {

    context('create gateway account - success', () => {
      const validCreateGatewayAccountRequest = gatewayAccountFixtures.validCreateGatewayAccountRequest();

      beforeEach((done) => {
        let pactified = validCreateGatewayAccountRequest.getPactified();
        connectorMock.addInteraction(
          new PactInteractionBuilder(ACCOUNTS_RESOURCE)
            .withUponReceiving('a valid create gateway account request')
            .withMethod('POST')
            .withRequestBody(pactified)
            .withStatusCode(201)
            .build()
        ).then(() => {
          done()
        }).catch(e =>
          console.log(e)
        );
      });

      afterEach((done) => {
        connectorMock.finalize().then(() => done())
      });

      it('should submit create gateway account successfully', function (done) {
        const createGatewayAccount = validCreateGatewayAccountRequest.getPlain();
        connectorClient.createGatewayAccount(
          createGatewayAccount.payment_provider,
          createGatewayAccount.type,
          createGatewayAccount.description,
          createGatewayAccount.analytics_id
        ).should.be.fulfilled.should.notify(done);
      });
    });

    context('create gateway account - bad request', () => {
      const invalidCreateGatewayAccountRequest = gatewayAccountFixtures.validCreateGatewayAccountRequest();
      const nonExistentPaymentProvider = 'non-existent-payment-provider'
      invalidCreateGatewayAccountRequest.payment_provider = nonExistentPaymentProvider;
      const errorResponse = {
        message: `Unsupported payment provider ${nonExistentPaymentProvider}.`
      };

      beforeEach((done) => {
        let pactified = invalidCreateGatewayAccountRequest.getPactified();
        connectorMock.addInteraction(
          new PactInteractionBuilder(ACCOUNTS_RESOURCE)
            .withUponReceiving('an invalid create gateway account request')
            .withMethod('POST')
            .withRequestBody(pactified)
            .withStatusCode(400)
            .withResponseBody(errorResponse)
            .build()
        ).then(() => {
          done()
        }).catch(e =>
          console.log(e)
        );
      });

      afterEach((done) => {
        connectorMock.finalize().then(() => done())
      });

      it('should return 400 on missing fields', function (done) {
        const createGatewayAccount = invalidCreateGatewayAccountRequest.getPlain();
        connectorClient.createGatewayAccount(
          createGatewayAccount.payment_provider,
          createGatewayAccount.type,
          createGatewayAccount.description,
          createGatewayAccount.analytics_id
        ).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(400);
          expect(response.message).to.deep.equal(errorResponse);
        }).should.notify(done);
      });
    });
  });

});
