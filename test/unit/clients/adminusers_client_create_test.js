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

var adminusersClient = getAdminUsersClient(`http://localhost:${mockPort}`);

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

  describe('create user API', function () {

    context('create user API - success', () => {
      let request = userFixtures.validMinimalUserCreateRequest();
      let params = {
        payload: request.getPlain()
      };

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(USER_PATH)
            .withUponReceiving('a valid user create request')
            .withMethod('POST')
            .withRequestBody(request.getPactified())
            .withStatusCode(201)
            .withResponseBody(userFixtures.validUserResponse(request.getPlain()).getPactified())
            .build()
        ).then(() => done());

      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should create a user successfully', function (done) {

        adminusersClient.createUser(params).should.be.fulfilled.then(function (user) {
          expect(user.username).to.be.equal(params.payload.username);
          expect(user.email).to.be.equal(params.payload.email);
          expect(user.password).to.be.equal('random-password');
          expect(user.gateway_account_id).to.be.equal(params.payload.gateway_account_id);
          expect(user.telephone_number).to.be.equal(params.payload.telephone_number);
          expect(user.otp_key).to.be.equal('43c3c4t');
          expect(user.role.name).to.be.equal('admin');
          expect(user.permissions.length).to.be.equal(3);
          expect(user._links.length).to.be.equal(1);
        }).should.notify(done);
      });
    });


    context('create user API - bad request', () => {
      let request = userFixtures.invalidUserCreateRequestWithFieldsMissing();
      let errorResponse = userFixtures.invalidUserCreateResponseWhenFieldsMissing();

      let params = {
        payload: request.getPlain()
      };

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(USER_PATH)
            .withUponReceiving('an invalid user create request with required parameters missing')
            .withMethod('POST')
            .withRequestBody(request.getPactified())
            .withStatusCode(400)
            .withResponseBody(errorResponse.getPactified())
            .build()
        ).then(() => done());
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should respond 400 when required fields missing', function (done) {

        adminusersClient.createUser(params).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(400);
          expect(response.message.errors.length).to.equal(4);
          expect(response.message.errors).to.deep.equal(errorResponse.getPlain().errors);
        }).should.notify(done);
      });
    });

    context('create user API - conflicting username', () => {
      let request = userFixtures.validMinimalUserCreateRequest();

      let params = {
        payload: request.getPlain()
      };

      let errorResponse = userFixtures.invalidCreateresponseWhenUsernameExists();

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(USER_PATH)
            .withState('user exists with the same username')
            .withUponReceiving('a user create request with conflicting username')
            .withMethod('POST')
            .withRequestBody(request.getPactified())
            .withStatusCode(409)
            .withResponseBody(errorResponse.getPactified())
            .build()
        ).then(() => done());
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should respond 409 when the username is already taken', function (done) {

        adminusersClient.createUser(params).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(409);
          expect(response.message.errors.length).to.equal(1);
          expect(response.message.errors).to.deep.equal(errorResponse.getPlain().errors);
        }).should.notify(done);
      });
    });

  });

});
