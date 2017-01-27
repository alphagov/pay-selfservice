var Pact = require('pact');
var helpersPath = __dirname + '/../../test_helpers/';
var pactProxy = require(helpersPath + '/pact_proxy.js');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var getAdminUsersClient = require('../../../app/services/clients/adminusers_client');
var userFixtures = require(__dirname + '/../fixtures/user_fixtures');
var PactInteractionBuilder = require(__dirname + '/../fixtures/pact_interaction_builder').PactInteractionBuilder;

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
    mockServer.start().then(function () {
      adminUsersMock = Pact({consumer: 'Selfservice', provider: 'AdminUsers', port: mockPort});
      done()
    });
  });

  /**
   * Remove the server and publish pacts to broker
   */
  after(function (done) {
    mockServer.delete().then(() => {
      done();
    })
  });

  describe('update login attempts API', function () {

    context('update login attempts  API - success', () => {
      let username = 'username';

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${USER_PATH}/${username}/attempt-login`)
            .withState('a user exists')
            .withUponReceiving('a valid login attempts update request')
            .withMethod('POST')
            .build()
        ).then(() => done());
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should update login attempts successfully', function (done) {

        adminusersClient.incrementLoginAttemptsForUser(username).should.be.fulfilled.notify(done);
      });
    });

    context('reset login attempts API - success', () => {
      let username = 'username';

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${USER_PATH}/${username}/attempt-login`)
            .withState('a user exists')
            .withUponReceiving('a valid login attempts reset request')
            .withMethod('POST')
            .withQuery({ action: 'reset' })
            .build()
        ).then(() => done());
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should reset login attempts successfully', function (done) {

        adminusersClient.resetLoginAttemptsForUser(username).should.be.fulfilled.notify(done);
      });
    });

    context('increment login attempts API - too many logins', () => {
      let username = 'username';

      let unauthorizedResponse = userFixtures.unauthorizedUserResponse();

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${USER_PATH}/${username}/attempt-login`)
            .withState('a user exists with max login attempts')
            .withUponReceiving('a valid login attempts update request')
            .withMethod('POST')
            .withStatusCode(401)
            .withResponseBody(unauthorizedResponse.getPactified())
            .build()
        ).then(() => done());
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should return unauthorised if too many login attempts', function (done) {

        adminusersClient.incrementLoginAttemptsForUser(username).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(401);
          expect(response.message.errors.length).to.equal(1);
          expect(response.message.errors).to.deep.equal(unauthorizedResponse.getPlain().errors);
        }).should.notify(done);
      });
    });

    context('increment login attempts API - user not found', () => {
      let username = 'non-existent-username';

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${USER_PATH}/${username}/attempt-login`)
            .withState('a user does not exist')
            .withUponReceiving('a valid login attempts update request')
            .withMethod('POST')
            .withStatusCode(404)
            .build()
        ).then(() => done());
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should return not found if user not exist', function (done) {

        adminusersClient.incrementLoginAttemptsForUser(username).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(404);
        }).should.notify(done);
      });
    });

  });

});
