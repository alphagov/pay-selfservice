var Pact = require('pact');
var helpersPath = __dirname + '/../../test_helpers/';
var pactProxy = require(helpersPath + '/pact_proxy.js');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var getAdminUsersClient = require('../../../app/services/clients/adminusers_client');
var userFixtures = require(__dirname + '/../fixtures/user_fixtures');

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

  describe('authenticate user API', function () {

    context('authenticate user API - success', () => {
      let request = userFixtures.validAuthenticateRequest({});
      let params = {
        payload: request.getPlain()
      };

      let validUserResponse = userFixtures.validUserResponse(request.getPlain());

      beforeEach((done) => {
        adminUsersMock.addInteraction({
          state: 'a user exists',
          uponReceiving: 'a valid user authenticate request',
          withRequest: {
            method: 'POST',
            path: `${USER_PATH}/authenticate`,
            headers: {'Accept': 'application/json'},
            body: request.getPactified()
          },
          willRespondWith: {
            status: 201,
            headers: {'Content-Type': 'application/json'},
            body: validUserResponse.getPactified()
          }
        }).then(() => done())
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should authenticate a user successfully', function (done) {

        adminusersClient.authenticateUser(params).should.be.fulfilled.then(function (user) {
          let expectedUser = validUserResponse.getPlain();
          expect(user.username).to.be.equal(expectedUser.username);
          expect(user.email).to.be.equal(expectedUser.email);
          expect(user.password).to.be.equal(expectedUser.password);
          expect(user.gateway_account_id).to.be.equal(expectedUser.gateway_account_id);
          expect(user.telephone_number).to.be.equal(expectedUser.telephone_number);
          expect(user.otp_key).to.be.equal(expectedUser.otp_key);
          expect(user.role.name).to.be.equal(expectedUser.role.name);
          expect(user.permissions.length).to.be.equal(expectedUser.permissions.length);
          expect(user._links.length).to.be.equal(expectedUser._links.length);
        }).should.notify(done);
      });
    });

    context('authenticate user API - unauthorized', () => {
      let request = userFixtures.validAuthenticateRequest({});
      let params = {
        payload: request.getPlain()
      };

      let unauthorizedResponse = userFixtures.unauthorizedUserResponse(request.getPlain());

      beforeEach((done) => {
        adminUsersMock.addInteraction({
          state: 'a user not exists with a given username password',
          uponReceiving: 'a user authenticate request with no matching user',
          withRequest: {
            method: 'POST',
            path: `${USER_PATH}/authenticate`,
            headers: {'Accept': 'application/json'},
            body: request.getPactified()
          },
          willRespondWith: {
            status: 401,
            headers: {'Content-Type': 'application/json'},
            body: unauthorizedResponse.getPactified()
          }
        }).then(() => done())
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should fail authentication if invalid username / password', function (done) {

        adminusersClient.authenticateUser(params).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(401);
          expect(response.message.errors.length).to.equal(1);
          expect(response.message.errors).to.deep.equal(unauthorizedResponse.getPlain().errors);
        }).should.notify(done);
      });
    });

    context('authenticate user API - bas request', () => {
      let request = {};
      let params = {
        payload: request
      };

      let badAuthenticateResponse = userFixtures.badAuthenticateResponse();

      beforeEach((done) => {
        adminUsersMock.addInteraction({
          state: 'a user not exists with a given username password',
          uponReceiving: 'a user authenticate request with no matching user',
          withRequest: {
            method: 'POST',
            path: `${USER_PATH}/authenticate`,
            headers: {'Accept': 'application/json'},
            body: request
          },
          willRespondWith: {
            status: 400,
            headers: {'Content-Type': 'application/json'},
            body: badAuthenticateResponse.getPactified()
          }
        }).then(() => done())
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it.only('should error bad request if mandatory fields are missing', function (done) {

        adminusersClient.authenticateUser(params).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(400);
          expect(response.message.errors.length).to.equal(2);
          expect(response.message.errors).to.deep.equal(badAuthenticateResponse.getPlain().errors);
        }).should.notify(done);
      });
    });

  });

});
