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

  describe('update login attempts API', function () {

    context('update login attempts  API - success', () => {
      let params = {
        username: 'username'
      };

      beforeEach((done) => {
        adminUsersMock.addInteraction({
          state: 'a user exists',
          uponReceiving: 'a valid login attempts update request',
          withRequest: {
            method: 'POST',
            path: `${USER_PATH}/${params.username}/attempt-login`,
            headers: {'Accept': 'application/json'},
          },
          willRespondWith: {
            status: 200,
            headers: {'Content-Type': 'application/json'},
          }
        }).then(() => done())
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should update login attempts successfully', function (done) {

        adminusersClient.incrementLoginAttemptsForUser(params).should.be.fulfilled.notify(done);
      });
    });

    context('reset login attempts API - success', () => {
      let params = {
        username: 'username'
      };

      beforeEach((done) => {
        adminUsersMock.addInteraction({
          state: 'a user exists',
          uponReceiving: 'a valid login attempts reset request',
          withRequest: {
            method: 'POST',
            path: `${USER_PATH}/${params.username}/attempt-login`,
            query: { action: 'reset' },
            headers: {'Accept': 'application/json'},
          },
          willRespondWith: {
            status: 200,
            headers: {'Content-Type': 'application/json'},
          }
        }).then(() => done())
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should update login attempts successfully', function (done) {

        adminusersClient.resetLoginAttemptsForUser(params).should.be.fulfilled.notify(done);
      });
    });

    context('increment login attempts API - too many logins', () => {
      let params = {
        username: 'username'
      };

      let unauthorizedResponse = userFixtures.unauthorizedUserResponse();

      beforeEach((done) => {
        adminUsersMock.addInteraction({
          state: 'a user exists with max login attempts',
          uponReceiving: 'a valid login attempts update request',
          withRequest: {
            method: 'POST',
            path: `${USER_PATH}/${params.username}/attempt-login`,
            headers: {'Accept': 'application/json'},
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

      it('should return unauthorised if too many login attempts', function (done) {

        adminusersClient.incrementLoginAttemptsForUser(params).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(401);
          expect(response.message.errors.length).to.equal(1);
          expect(response.message.errors).to.deep.equal(unauthorizedResponse.getPlain().errors);
        }).should.notify(done);
      });
    });


    context('reset login attempts API - success', () => {
      let params = {
        username: 'username'
      };

      beforeEach((done) => {
        adminUsersMock.addInteraction({
          state: 'a user exists',
          uponReceiving: 'a valid login attempts reset request',
          withRequest: {
            method: 'POST',
            path: `${USER_PATH}/${params.username}/attempt-login`,
            query: { action: 'reset' },
            headers: {'Accept': 'application/json'},
          },
          willRespondWith: {
            status: 200,
            headers: {'Content-Type': 'application/json'},
          }
        }).then(() => done())
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should update login attempts successfully', function (done) {

        adminusersClient.resetLoginAttemptsForUser(params).should.be.fulfilled.notify(done);
      });
    });

    context('increment login attempts API - user not found', () => {
      let params = {
        username: 'non-existent-username'
      };

      beforeEach((done) => {
        adminUsersMock.addInteraction({
          state: 'a user does not exist',
          uponReceiving: 'a valid login attempts update request',
          withRequest: {
            method: 'POST',
            path: `${USER_PATH}/${params.username}/attempt-login`,
            headers: {'Accept': 'application/json'},
          },
          willRespondWith: {
            status: 404,
            headers: {'Content-Type': 'application/json'},
          }
        }).then(() => done())
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it.only('should return not found if user not exist', function (done) {

        adminusersClient.incrementLoginAttemptsForUser(params).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(404);
        }).should.notify(done);
      });
    });

  });

});
