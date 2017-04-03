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
const FORGOTTEN_PASSWORD_PATH = '/v1/api/forgotten-passwords';
var mockPort = Math.floor(Math.random() * 65535);
var mockServer = pactProxy.create('localhost', mockPort);

var adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${mockPort}`});

describe('adminusers client - create forgotten password', function () {

  var adminUsersMock;
  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000);
    mockServer.start().then(function () {
      adminUsersMock = Pact({consumer: 'Selfservice-create-forgotten-password', provider: 'AdminUsers', port: mockPort});
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

  describe('Forgotten Password API', function () {

    context('create forgotten password API - success', () => {

      let request = userFixtures.validForgottenPasswordCreateRequest('existing-user');
      let validForgottenPasswordResponse = userFixtures.validForgottenPasswordResponse(request.getPlain());

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(FORGOTTEN_PASSWORD_PATH)
            .withState('a user exist')
            .withUponReceiving('a valid forgotten password request')
            .withMethod('POST')
            .withRequestBody(request.getPactified())
            .withStatusCode(201)
            .withResponseBody(validForgottenPasswordResponse.getPactified())
            .build()
        ).then(() => done());
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should create a forgotten password entry successfully', function (done) {

        let requestData = request.getPlain();
        adminusersClient.createForgottenPassword(requestData.username).should.be.fulfilled.then(function (forgottenPassword) {

          var expectedResponse = validForgottenPasswordResponse.getPlain();
          expect(forgottenPassword.code).to.be.equal(expectedResponse.code);
          expect(forgottenPassword.date).to.be.equal(expectedResponse.date);
          expect(forgottenPassword.username).to.be.equal(expectedResponse.username);
          expect(forgottenPassword._links.length).to.be.equal(expectedResponse._links.length);

        }).should.notify(done);
      });
    });

    context('create forgotten password API - bad request', () => {
      let request = {username: ''};

      let badForgottenPasswordResponse = userFixtures.badForgottenPasswordResponse();

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(FORGOTTEN_PASSWORD_PATH)
            .withUponReceiving('an invalid forgotten password request')
            .withMethod('POST')
            .withRequestBody(request)
            .withStatusCode(400)
            .withResponseBody(badForgottenPasswordResponse.getPactified())
            .build()
        ).then(() => done());
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should error when forgotten password creation if mandatory fields are missing', function (done) {

        adminusersClient.createForgottenPassword(request.username).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(400);
          expect(response.message.errors.length).to.equal(1);
          expect(response.message.errors).to.deep.equal(badForgottenPasswordResponse.getPlain().errors);
        }).should.notify(done);
      });
    });

    context('create forgotten password API - not found', () => {
      let request = userFixtures.validForgottenPasswordCreateRequest('nonexisting');

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(FORGOTTEN_PASSWORD_PATH)
            .withState('a user does not exist')
            .withUponReceiving('a forgotten password request for non existent user')
            .withMethod('POST')
            .withRequestBody(request.getPactified())
            .withStatusCode(404)
            .withResponseHeaders({})
            .build()
        ).then(() => done());
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should error when forgotten password creation if no user found', function (done) {

        let requestData = request.getPlain();
        adminusersClient.createForgottenPassword(requestData.username).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(404);
        }).should.notify(done);
      });
    });

  });
});
