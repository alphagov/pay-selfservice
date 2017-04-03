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
const USER_PATH = '/v1/api/users';
var mockPort = Math.floor(Math.random() * 65535);
var mockServer = pactProxy.create('localhost', mockPort);

var adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${mockPort}`});

describe('adminusers client', function () {

  var adminUsersMock;
  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000);
    mockServer.start().then(function () {
      adminUsersMock = Pact({consumer: 'Selfservice-secondfactor', provider: 'AdminUsers', port: mockPort});
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

  describe('send new second factor API', function () {

    context('send new second factor API - success', () => {
      let username = 'username';

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${USER_PATH}/${username}/second-factor`)
            .withState('a user exists')
            .withUponReceiving('a valid second factor post request')
            .withMethod('POST')
            .build()
        ).then(() => done());
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should send a new 2FA token successfully', function (done) {

        adminusersClient.sendSecondFactor(username).should.be.fulfilled.notify(done);
      });
    });

    context('send new 2FA token API - user not found', () => {
      let username = 'non-existent-username';

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${USER_PATH}/${username}/second-factor`)
            .withState('a user does not exist')
            .withUponReceiving('a valid second factor post request')
            .withMethod('POST')
            .withStatusCode(404)
            .build()
        ).then(() => done());
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should return not found if user not exist', function (done) {

        adminusersClient.sendSecondFactor(username).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(404);
        }).should.notify(done);
      });
    });

  });


  describe('authenticate second factor API', function () {

    context('authenticate a second factor API - success', () => {
      let token = '121212';
      let request = userFixtures.validAuthenticateSecondFactorRequest(token);
      let minimalUser = userFixtures.validMinimalUser();
      let username = minimalUser.getPlain().username;

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${USER_PATH}/${username}/second-factor/authenticate`)
            .withState('a user exists')
            .withUponReceiving('a valid authenticate second factor token request')
            .withRequestBody(request.getPactified())
            .withResponseBody(userFixtures.validUserResponse(minimalUser.getPlain()).getPactified())
            .withMethod('POST')
            .build()
        ).then(() => done());
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('authenticate a valid 2FA token successfully', function (done) {

        adminusersClient.authenticateSecondFactor(username, token).should.be.fulfilled.then(function (createdUser) {
          expect(createdUser.username).to.be.equal(username);
        }).should.notify(done);

      });
    });

    context('authenticate second factor API - bad request', () => {
      let token = 'non-numeric-code';
      let request = userFixtures.validAuthenticateSecondFactorRequest(token);
      let username = 'username';

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${USER_PATH}/${username}/second-factor/authenticate`)
            .withState('a user exists')
            .withUponReceiving('a invalid authenticate second factor token request')
            .withRequestBody(request.getPactified())
            .withMethod('POST')
            .withStatusCode(400)
            .build()
        ).then(() => done());
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('error bad request an invalid 2FA token', function (done) {

        adminusersClient.authenticateSecondFactor(username, token).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(400);
        }).should.notify(done);

      });
    });

    context('authenticate second factor API - unauthorized', () => {
      let token = '654321';
      let request = userFixtures.validAuthenticateSecondFactorRequest(token);
      let username = 'username';

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${USER_PATH}/${username}/second-factor/authenticate`)
            .withState('a user exists')
            .withUponReceiving('an expired/unauthorized second factor token request')
            .withRequestBody(request.getPactified())
            .withMethod('POST')
            .withStatusCode(401)
            .build()
        ).then(() => done());
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('error unauthorized an expired/unauthorized 2FA token', function (done) {

        adminusersClient.authenticateSecondFactor(username, token).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(401);
        }).should.notify(done);

      });
    });

  });

});
