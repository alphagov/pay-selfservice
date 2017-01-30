var Pact = require('pact');
var helpersPath = __dirname + '/../../test_helpers/';
var pactProxy = require(helpersPath + '/pact_proxy.js');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var getAdminUsersClient = require('../../../app/services/clients/adminusers_client');
var userFixtures = require(__dirname + '/../fixtures/user_fixtures');
var PactInteractionBuilder = require(__dirname + '/../fixtures/pact_interaction_builder').PactInteractionBuilder;
var User = require(__dirname + '/../../../app/models/user2').User;

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

  describe('create user API', function () {

    context('create user API - success', () => {
      let minimalUser = userFixtures.validMinimalUser();

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(USER_PATH)
            .withUponReceiving('a valid user create request')
            .withMethod('POST')
            .withRequestBody(minimalUser.getPactified())
            .withStatusCode(201)
            .withResponseBody(userFixtures.validUserResponse(minimalUser.getPlain()).getPactified())
            .build()
        ).then(() => done());

      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should create a user successfully', function (done) {
        let user = minimalUser.getAsObject();
        adminusersClient.createUser(user).should.be.fulfilled.then(function (createdUser) {
          expect(createdUser.username).to.be.equal(user.username);
          expect(createdUser.email).to.be.equal(user.email);
          expect(createdUser.gatewayAccountId).to.be.equal(user.gatewayAccountId);
          expect(createdUser.telephoneNumber).to.be.equal(user.telephoneNumber);
          expect(createdUser.otpKey).to.be.equal('43c3c4t');
          expect(createdUser.role.name).to.be.equal('admin');
          expect(createdUser.permissions.length).to.be.equal(3);
        }).should.notify(done);
      });
    });


    context('create user API - bad request', () => {
      let request = userFixtures.invalidUserCreateRequestWithFieldsMissing();
      let errorResponse = userFixtures.invalidUserCreateResponseWhenFieldsMissing();

      let user = new User(request.getPlain());

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

        adminusersClient.createUser(user).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(400);
          expect(response.message.errors.length).to.equal(4);
          expect(response.message.errors).to.deep.equal(errorResponse.getPlain().errors);
        }).should.notify(done);
      });
    });

    context('create user API - conflicting username', () => {
      let minimalUser = userFixtures.validMinimalUser();

      let errorResponse = userFixtures.invalidCreateresponseWhenUsernameExists();

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(USER_PATH)
            .withState('user exists with the same username')
            .withUponReceiving('a user create request with conflicting username')
            .withMethod('POST')
            .withRequestBody(minimalUser.getPactified())
            .withStatusCode(409)
            .withResponseBody(errorResponse.getPactified())
            .build()
        ).then(() => done());
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should respond 409 when the username is already taken', function (done) {

        adminusersClient.createUser(minimalUser.getAsObject()).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(409);
          expect(response.message.errors.length).to.equal(1);
          expect(response.message.errors).to.deep.equal(errorResponse.getPlain().errors);
        }).should.notify(done);
      });
    });

  });

});
