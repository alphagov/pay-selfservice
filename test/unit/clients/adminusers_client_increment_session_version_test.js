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

  describe('increment session version API', function () {

    context('increment session version  API - success', () => {
      let request = userFixtures.validIncrementSessionVersionRequest();

      let params = {
        username: 'username',
        payload: request.getPlain()
      };

      beforeEach((done) => {
        adminUsersMock.addInteraction({
          state: 'a user exists',
          uponReceiving: 'a valid increment session version update request',
          withRequest: {
            method: 'PATCH',
            path: `${USER_PATH}/${params.username}`,
            headers: {'Accept': 'application/json'},
            body: request.getPactified()
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
        adminUsersMock.addInteraction({
          state: 'a user exists',
          uponReceiving: 'a bad increment session version update request',
          withRequest: {
            method: 'PATCH',
            path: `${USER_PATH}/${params.username}`,
            headers: {'Accept': 'application/json'},
            body: request
          },
          willRespondWith: {
            status: 400,
            headers: {'Content-Type': 'application/json'},
            body: badIncrementSessionVersionResponse.getPactified()
          }
        }).then(() => done())
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
        adminUsersMock.addInteraction({
          state: 'a user does not exist',
          uponReceiving: 'a valid increment session version request',
          withRequest: {
            method: 'PATCH',
            path: `${USER_PATH}/${params.username}`,
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

      it('should return not found if user not exist', function (done) {

        adminusersClient.incrementSessionVersionForUser(params).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(404);
        }).should.notify(done);
      });
    });

  });

});
