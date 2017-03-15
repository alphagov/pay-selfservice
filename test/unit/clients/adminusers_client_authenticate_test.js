var Pact = require('pact');
var helpersPath = __dirname + '/../../test_helpers/';
var pactProxy = require(helpersPath + '/pact_proxy.js');
var chai = require('chai');
var _ = require('lodash');
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

describe('adminusers client - authenticate', function () {

  var adminUsersMock;
  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000);
    mockServer.start().then(function () {
      adminUsersMock = Pact({consumer: 'Selfservice-authenticate', provider: 'AdminUsers', port: mockPort});
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

  describe('authenticate user API', function () {

    context('authenticate user API - success', () => {

      let request = userFixtures.validAuthenticateRequest({username: 'existing-user'});
      let validUserResponse = userFixtures.validUserResponse(request.getPlain());

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${USER_PATH}/authenticate`)
            .withState('a user exists')
            .withUponReceiving('a valid user authenticate request')
            .withMethod('POST')
            .withRequestBody(request.getPactified())
            .withStatusCode(200)
            .withResponseBody(validUserResponse.getPactified())
            .build()
        ).then(() => done());

      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should authenticate a user successfully', function (done) {

        let requestData = request.getPlain();

        adminusersClient.authenticateUser(requestData.username, requestData.password).should.be.fulfilled.then(function (user) {

          let expectedUser = validUserResponse.getPlain();
          expect(user.username).to.be.equal(expectedUser.username);
          expect(user.email).to.be.equal(expectedUser.email);
          expect(_.isEqual(user.gatewayAccountIds, expectedUser.gateway_account_ids)).to.be.equal(true);
          expect(user.telephoneNumber).to.be.equal(expectedUser.telephone_number);
          expect(user.otpKey).to.be.equal(expectedUser.otp_key);
          expect(user.role.name).to.be.equal(expectedUser.role.name);
          expect(user.permissions.length).to.be.equal(expectedUser.permissions.length);
        }).should.notify(done);
      });
    });

    context('authenticate user API - unauthorized', () => {
      let request = userFixtures.validAuthenticateRequest({username: "nonexisting"});

      let unauthorizedResponse = userFixtures.unauthorizedUserResponse();

      beforeEach((done) => {

        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${USER_PATH}/authenticate`)
            .withState('a user not exists with a given username password')
            .withUponReceiving('a user authenticate request with no matching user')
            .withMethod('POST')
            .withRequestBody(request.getPactified())
            .withStatusCode(401)
            .withResponseBody(unauthorizedResponse.getPactified())
            .build()
        ).then(() => done());
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should fail authentication if invalid username / password', function (done) {

        let requestData = request.getPlain();
        adminusersClient.authenticateUser(requestData.username, requestData.password).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(401);
          expect(response.message.errors.length).to.equal(1);
          expect(response.message.errors).to.deep.equal(unauthorizedResponse.getPlain().errors);
        }).should.notify(done);
      });
    });

    context('authenticate user API - bad request', () => {
      let request = {username: '', password: ''};

      let badAuthenticateResponse = userFixtures.badAuthenticateResponse();

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${USER_PATH}/authenticate`)
            .withState('a user exists with a given username password')
            .withUponReceiving('a user authenticate request with malformed request')
            .withMethod('POST')
            .withRequestBody(request)
            .withStatusCode(400)
            .withResponseBody(badAuthenticateResponse.getPactified())
            .build()
        ).then(() => done());
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should error bad request if mandatory fields are missing', function (done) {

        adminusersClient.authenticateUser(request.username, request.password).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(400);
          expect(response.message.errors.length).to.equal(2);
          expect(response.message.errors).to.deep.equal(badAuthenticateResponse.getPlain().errors);
        }).should.notify(done);
      });
    });

  });

});
