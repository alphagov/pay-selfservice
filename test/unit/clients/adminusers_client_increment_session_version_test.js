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

  describe('increment session version API', function () {

    context('increment session version  API - success', () => {
      let request = userFixtures.validIncrementSessionVersionRequest();

      let params = {
        username: 'username',
        payload: request.getPlain()
      };

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${USER_PATH}/${params.username}`)
            .withState('a user exists')
            .withUponReceiving('a valid increment session version update request')
            .withMethod('PATCH')
            .withRequestBody(request.getPactified())
            .build()
        ).then(() => done());
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should increment session version successfully', function (done) {

        adminusersClient.incrementSessionVersionForUser(params).should.be.fulfilled.notify(done);
      });
    });


    context('increment session version  API - bad request', () => {
      let request = {};

      let params = {
        username: 'username',
        payload: request
      };

      let badIncrementSessionVersionResponse = userFixtures.badIncrementSessionVersionResponse(params);

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${USER_PATH}/${params.username}`)
            .withState('a user exists')
            .withUponReceiving('a bad increment session version update request')
            .withMethod('PATCH')
            .withRequestBody(request)
            .withStatusCode(400)
            .withResponseBody(badIncrementSessionVersionResponse.getPactified())
            .build()
        ).then(() => done());
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should error if mandatory fields are missing', function (done) {

        adminusersClient.incrementSessionVersionForUser(params).should.be.rejected.then(function (response){
          expect(response.errorCode).to.equal(400);
          expect(response.message.errors.length).to.equal(3);
          expect(response.message.errors).to.deep.equal(badIncrementSessionVersionResponse.getPlain().errors);
        }).should.notify(done);
      });
    });


    context('increment session version API - user not found', () => {
      let params = {
        username: 'non-existent-username'
      };

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${USER_PATH}/${params.username}`)
            .withState('a user does not exist')
            .withUponReceiving('a valid increment session version request')
            .withMethod('PATCH')
            .withStatusCode(404)
            .build()
        ).then(() => done());
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should return not found if user not exist', function (done) {

        adminusersClient.incrementSessionVersionForUser(params).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(404);
        }).should.notify(done);
      });
    });

  });

});
