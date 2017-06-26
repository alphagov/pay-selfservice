var Pact = require('pact');
var helpersPath = __dirname + '/../../test_helpers/';
var pactProxy = require(helpersPath + '/pact_proxy.js');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var getAdminUsersClient = require('../../../app/services/clients/adminusers_client');
var serviceFixtures = require(__dirname + '/../../fixtures/service_fixtures');
var PactInteractionBuilder = require(__dirname + '/../../fixtures/pact_interaction_builder').PactInteractionBuilder;

chai.use(chaiAsPromised);

const expect = chai.expect;
const SERVICE_RESOURCE = '/v1/api/services';
var mockPort = Math.floor(Math.random() * 65535);
var mockServer = pactProxy.create('localhost', mockPort);

var adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${mockPort}`});

describe('adminusers client - create a new service', function () {

  let adminUsersMock;

  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000);
    mockServer.start().then(function () {
      adminUsersMock = Pact({consumer: 'Selfservice-create-new-service', provider: 'adminusers', port: mockPort});
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

  describe('creating a service', function () {

    context('create a service - success', () => {
      const validRequest = serviceFixtures.validCreateServiceRequest();
      const validCreateServiceResponse = serviceFixtures.validCreateServiceResponse();

      beforeEach((done) => {
        let pactified = validRequest.getPactified();
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${SERVICE_RESOURCE}`)
            .withUponReceiving('a valid create service request')
            .withMethod('POST')
            .withRequestBody(pactified)
            .withStatusCode(201)
            .withResponseBody(validCreateServiceResponse.getPactified())
            .build()
        ).then(() => {
          done()
        }).catch(e =>
          console.log(e)
        );
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should create a new service', function (done) {
        adminusersClient.createService(validRequest.getPlain().gateway_account_ids).should.be.fulfilled.then(service => {
          expect(service).to.deep.equal({
            'external_id': 'externalId',
            'name': 'serviceName'
          });
        }).should.notify(done);
      });
    });
  });
});