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
const SERVICES_PATH = '/v1/api/services';
var mockPort = Math.floor(Math.random() * 65535);
var mockServer = pactProxy.create('localhost', mockPort);

var adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${mockPort}`});

describe('adminusers client - service users', function () {

  let adminUsersMock;
  let service_id = 12345;
  let non_existing_service_id = 500;
  let response_params = { service_ids : [service_id]};
  let getServiceUsersResponse = serviceFixtures.validServiceUsersResponse(response_params);

  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000);
    mockServer.start().then(function () {
      adminUsersMock = Pact({consumer: 'Selfservice-service-users', provider: 'AdminUsers', port: mockPort});
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

  describe('service user API', function () {

    context('service user - success', () => {

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${SERVICES_PATH}/${service_id}/users`)
            .withState('a service exists with the given id')
            .withUponReceiving('a valid get service users request')
            .withResponseBody(getServiceUsersResponse.getPactified())
            .withStatusCode(200)
            .build()
        ).then(() => done());
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should return service users successfully', function (done) {

        adminusersClient.getServiceUsers(service_id).should.be.fulfilled.then (
           function (users) {
             let expectedResponse = getServiceUsersResponse.getPlain();
             expect(users[0].service_ids[0]).to.be.equal(expectedResponse[0].service_ids[0]);
           }
        ).should.notify(done);
      });
    });

    context('service user - failure', () => {

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${SERVICES_PATH}/${non_existing_service_id}/users`)
            .withState('a service doesnt exists with the given id')
            .withUponReceiving('a valid get service users request with non-existing service id')
            .withResponseBody(serviceFixtures.getServiceUsersNotFoundResponse().getPactified())
            .withStatusCode(404)
            .build()
        ).then(() => done());
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should return service not found', function (done) {

         adminusersClient.getServiceUsers(non_existing_service_id).should.be.rejected.then (
            function (err) {
                expect(err.errorCode).to.equal(404);
            }
         ).should.notify(done);
       });
    });
   });
});
