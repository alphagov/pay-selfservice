var Pact = require('pact');
var helpersPath = __dirname + '/../../test_helpers/';
var pactProxy = require(helpersPath + '/pact_proxy.js');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var userFixtures = require(__dirname + '/../fixtures/user_fixtures');
var getAdminUsersClient = require('../../../app/services/clients/adminusers_client');
var PactInteractionBuilder = require(__dirname + '/../fixtures/pact_interaction_builder').PactInteractionBuilder;

chai.use(chaiAsPromised);

const expect = chai.expect;

const USER_PATH = '/v1/api/users';
var mockPort = Math.floor(Math.random() * 65535);
var mockServer = pactProxy.create('localhost', mockPort);
var adminusersClient = getAdminUsersClient(`http://localhost:${mockPort}`);

describe('adminusers client', function () {

  var adminUsersMock;
  /**
   * Start the server and set up Pact
   */
  beforeEach(function (done) {
    mockServer.start().then(function () {
      adminUsersMock = Pact({consumer: 'Selfservice', provider: 'AdminUsers', port: mockPort});
      done()
    });
  });

  /**
   * Remove the server and publish pacts to broker
   */
  afterEach(function (done) {
    mockServer.delete().then(() => {
      done();
    })
  });

  describe('GET user api', () => {

    context('GET user api - success', () => {

      let params = {
        username: "existing-user"
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

        adminusersClient.getUser(params).should.be.fulfilled.then(function (user) {
          expect(user.username).to.be.equal(expectedUserData.username);
          expect(user.email).to.be.equal(expectedUserData.email);
          expect(user.password).to.be.equal(expectedUserData.password);
          expect(user.gateway_account_id).to.be.equal(expectedUserData.gateway_account_id);
          expect(user.telephone_number).to.be.equal(expectedUserData.telephone_number);
          expect(user.otp_key).to.be.equal(expectedUserData.otp_key);
          expect(user.role.name).to.be.equal(expectedUserData.role.name);
          expect(user.permissions.length).to.be.equal(expectedUserData.permissions.length);
          expect(user._links.length).to.be.equal(user._links.length);
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
            .withUponReceiving('a valid get user request')
            .withStatusCode(404)
            .build()
        ).then(() => done());
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should respond 404 if user not found', function (done) {

        adminusersClient.getUser(params).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(404);
        }).should.notify(done);
      });
    });

  });
});
