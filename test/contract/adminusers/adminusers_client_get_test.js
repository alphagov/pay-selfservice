var Pact = require('pact');
var helpersPath = __dirname + '/../../test_helpers/';
var pactProxy = require(helpersPath + '/pact_proxy.js');
var chai = require('chai');
var _ = require('lodash');
var chaiAsPromised = require('chai-as-promised');
var userFixtures = require(__dirname + '/../../fixtures/user_fixtures');
var getAdminUsersClient = require('../../../app/services/clients/adminusers_client');
var PactInteractionBuilder = require(__dirname + '/../../fixtures/pact_interaction_builder').PactInteractionBuilder;
var should = require('chai').should();

chai.use(chaiAsPromised);

const expect = chai.expect;

const USER_PATH = '/v1/api/users';
var mockPort = Math.floor(Math.random() * 65535);
var mockServer = pactProxy.create('localhost', mockPort);
var adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${mockPort}`});

describe('adminusers client - get user', function () {

  var adminUsersMock;
  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000);
    mockServer.start().then(function () {
      adminUsersMock = Pact({consumer: 'Selfservice-get-user', provider: 'AdminUsers', port: mockPort});
      done();
    });
  });

  /**
   * Remove the server and publish pacts to broker
   */
  after(function (done) {
    mockServer.delete()
      .then(pactProxy.publish(() => {
        pactProxy.removeAll();
        done();
      }));
  });

  describe.only('GET user api', () => {

    context('GET user api - success', () => {

      let params = {
        username: "existing-user",
        gateway_account_ids: ["666", "7"]
      };

      let getUserResponse = userFixtures.validUserResponse(params);

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${USER_PATH}/${params.username}`)
            .withState('a user exits with the given name')
            .withUponReceiving('a valid get user request')
            .withResponseBody(getUserResponse.getPactified())
            .build()
        ).then(() => done());
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should find a user successfully', function (done) {
        let expectedUserData = getUserResponse.getPlain();

        adminusersClient.getUser(params.username).should.be.fulfilled.then(function (user) {
          expect(user.username).to.be.equal(expectedUserData.username);
          expect(user.email).to.be.equal(expectedUserData.email);
          expect(expectedUserData.gateway_account_ids.length).to.be.equal(2);
          expect(user.telephoneNumber).to.be.equal(expectedUserData.telephone_number);
          expect(user.otpKey).to.be.equal(expectedUserData.otp_key);
          expect(user.role.name).to.be.equal(expectedUserData.role.name);
          expect(user.permissions.length).to.be.equal(expectedUserData.permissions.length);
        }).should.notify(done);
      });
    });

    context('GET user api - not found', () => {

      let params = {
        username: "non-existent-user"
      };

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${USER_PATH}/${params.username}`)
            .withState('no user exits with the given name')
            .withUponReceiving('a valid get user request of an non existing user')
            .withStatusCode(404)
            .withResponseHeaders({})
            .build()
        ).then(() => done());
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should respond 404 if user not found', function (done) {

        adminusersClient.getUser(params.username).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(404);
        }).should.notify(done);
      });
    });

  });
});
