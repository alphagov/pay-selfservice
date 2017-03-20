var Pact = require('pact');
var helpersPath = __dirname + '/../../test_helpers/';
var pactProxy = require(helpersPath + '/pact_proxy.js');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var getAdminUsersClient = require('../../../app/services/clients/adminusers_client');
var userFixtures = require(__dirname + '/../../fixtures/user_fixtures');
var PactInteractionBuilder = require(__dirname + '/../../fixtures/pact_interaction_builder').PactInteractionBuilder;

chai.use(chaiAsPromised);

const expect = chai.expect;
const RESET_PASSWORD_PATH = '/v1/api/reset-password';
var mockPort = Math.floor(Math.random() * 65535);
var mockServer = pactProxy.create('localhost', mockPort);

var adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${mockPort}`});

describe('adminusers client - update password', function () {

  var adminUsersMock;
  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000);
    mockServer.start().then(function () {
      adminUsersMock = Pact({consumer: 'Selfservice-update-password', provider: 'AdminUsers', port: mockPort});
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

  describe('update password API', function () {

    context('update password for user API - success', () => {
      let request = userFixtures.validUpdatePasswordRequest("avalidforgottenpasswordtoken");

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(RESET_PASSWORD_PATH)
            .withState('a valid forgotten password entry and a related user exists')
            .withUponReceiving('a valid update password request')
            .withMethod('POST')
            .withRequestBody(request.getPactified())
            .withStatusCode(204)
            .withResponseHeaders({})
            .build()
        ).then(() => done());
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should update password successfully', function (done) {

        let requestData = request.getPlain();
        adminusersClient.updatePasswordForUser(requestData.forgotten_password_code, requestData.new_password).should.be.fulfilled.notify(done);
      });
    });

    context('update password for user API - not found', () => {
      let request = userFixtures.validUpdatePasswordRequest();

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(RESET_PASSWORD_PATH)
            .withState('a forgotten password does not exists')
            .withUponReceiving('a valid update password request')
            .withMethod('POST')
            .withRequestBody(request.getPactified())
            .withStatusCode(404)
            .build()
        ).then(() => done());
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should error if forgotten password code is not found/expired', function (done) {

        let requestData = request.getPlain();
        adminusersClient.updatePasswordForUser(requestData.forgotten_password_code, requestData.new_password).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(404);
        }).should.notify(done);
      });
    });

  });
});
