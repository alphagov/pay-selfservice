var Pact = require('pact');
var helpersPath = __dirname + '/../../test_helpers/';
var pactProxy = require(helpersPath + '/pact_proxy.js');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const expect = chai.expect;

const USER_PATH = '/v1/api/users';
const mockPort = Math.floor(Math.random() * 65535);
const mockServer = pactProxy.create('localhost', mockPort);
process.env.ADMINUSERS_URL = `http://localhost:${mockPort}`;

var adminusersClient = require('../../../app/services/clients/adminusers_client');

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

  describe('create user API', function () {

    context('create user API - success', () => {

      let params = {
        payload: {
          username: "new-user",
          email: "new-user@example.com",
          gateway_account_id: 1,
          telephone_number: "123456789"
        }
      };

      let createUserResponse = {
        username: params.payload.username,
        email: params.payload.email,
        password: "random-password",
        gateway_account_id: params.payload.gateway_account_id,
        telephone_number: params.payload.telephone_number,
        otp_key: "43c3c4t",
        role: {"name": "admin", "description": "Administrator"},
        permissions: ["perm-1", "perm-2", "perm-3"],
        "_links": [{
          "href": `http://adminusers.service/v1/api/users/${params.payload.username}`,
          "rel": "self",
          "method": "GET"
        }]
      };

      beforeEach((done) => {
        adminUsersMock.addInteraction({
          state: 'healthy',
          uponReceiving: 'a valid user create request',
          withRequest: {
            method: 'POST',
            path: USER_PATH,
            headers: {'Accept': 'application/json'},
            body: params.payload
          },
          willRespondWith: {
            status: 201,
            headers: {'Content-Type': 'application/json'},
            body: createUserResponse
          }
        }).then(() => done())
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should create a user successfully', function (done) {

        adminusersClient.createUser(params)
          .then((user) => {
            expect(user.username).to.be.equal('new-user');
            expect(user.email).to.be.equal('new-user@example.com');
            expect(user.password).to.be.equal('random-password');
            expect(user.gateway_account_id).to.be.equal(1);
            expect(user.telephone_number).to.be.equal('123456789');
            expect(user.otp_key).to.be.equal('43c3c4t');
            expect(user.role.name).to.be.equal('admin');
            expect(user.permissions.length).to.be.equal(3);
            expect(user._links.length).to.be.equal(1);
            done();
          })
          .catch((e) => {
            console.log(JSON.stringify(e));
          });
      });
    });


    context('create user API - bad request', () => {

      let params = {
        payload: {
          gateway_account_id: 1
        }
      };

      let errorResponse = {
        errors: ["Field [username] is required", "Field [email] is required", "Field [telephone_number] is required", "Field [role_name] is required"]
      };

      beforeEach((done) => {
        adminUsersMock.addInteraction({
          state: 'healthy',
          uponReceiving: 'an invalid user create request with required parameters missing',
          withRequest: {
            method: 'POST',
            path: USER_PATH,
            headers: {'Accept': 'application/json'},
            body: params.payload
          },
          willRespondWith: {
            status: 400,
            headers: {'Content-Type': 'application/json'},
            body: errorResponse
          }
        }).then(() => done())
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should respond 400 when required fields missing', function (done) {

        adminusersClient.createUser(params).should.be.rejected.then(function (response) {
          expect(response.response.statusCode).to.equal(400);
          expect(response.response.body.errors.length).to.equal(4);
          expect(response.response.body.errors).to.deep.equal(errorResponse.errors);
        }).should.notify(done);
      });
    });

    context('create user API - conflicting username', () => {

      let params = {
        payload: {
          username: "existing-username",
          email: "existing-username@example.com",
          gateway_account_id: 1,
          telephone_number: "123456789"
        }
      };

      let errorResponse = {
        errors: ["username [existing-username] already exists"]
      };

      beforeEach((done) => {
        adminUsersMock.addInteraction({
          state: 'user exists with the same username',
          uponReceiving: 'a user create request with conflicting username',
          withRequest: {
            method: 'POST',
            path: USER_PATH,
            headers: {'Accept': 'application/json'},
            body: params.payload
          },
          willRespondWith: {
            status: 409,
            headers: {'Content-Type': 'application/json'},
            body: errorResponse
          }
        }).then(() => done())
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should respond 409 when the username is already taken', function (done) {

        adminusersClient.createUser(params).should.be.rejected.then(function (response) {
          expect(response.response.statusCode).to.equal(409);
          expect(response.response.body.errors.length).to.equal(1);
          expect(response.response.body.errors).to.deep.equal(errorResponse.errors);
        }).should.notify(done);
      });
    });

  });

  describe('GET user api', () => {

    context('GET user api - success', () => {

      let params = {
        username: "existing-user"
      };

      let getUserResponse = {
        username: params.username,
        email: "existing-user@example.com",
        password: "random-password",
        gateway_account_id: 1,
        telephone_number: "123456789",
        otp_key: "43c3c4t",
        role: {"name": "admin", "description": "Administrator"},
        permissions: ["perm-1", "perm-2", "perm-3"],
        "_links": [{
          "href": `http://adminusers.service/v1/api/users/${params.username}`,
          "rel": "self",
          "method": "GET"
        }]
      };

      beforeEach((done) => {
        adminUsersMock.addInteraction({
          state: 'a user exits with the given name',
          uponReceiving: 'a valid get user request',
          withRequest: {
            method: 'GET',
            path: `${USER_PATH}/${params.username}`,
            headers: {'Accept': 'application/json'}
          },
          willRespondWith: {
            status: 200,
            headers: {'Content-Type': 'application/json'},
            body: getUserResponse
          }
        }).then(() => done())
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should find a user successfully', function (done) {

        adminusersClient.getUser(params)
          .then((user) => {
            expect(user.username).to.be.equal('existing-user');
            expect(user.email).to.be.equal('existing-user@example.com');
            expect(user.password).to.be.equal('random-password');
            expect(user.gateway_account_id).to.be.equal(1);
            expect(user.telephone_number).to.be.equal('123456789');
            expect(user.otp_key).to.be.equal('43c3c4t');
            expect(user.role.name).to.be.equal('admin');
            expect(user.permissions.length).to.be.equal(3);
            expect(user._links.length).to.be.equal(1);
            done();
          })
          .catch((e) => {
            console.log(JSON.stringify(e));
          });
      });
    });

    context('GET user api - not found', () => {

      let params = {
        username: "non-existent-user"
      };

      beforeEach((done) => {
        adminUsersMock.addInteraction({
          state: 'no user exits with the given name',
          uponReceiving: 'a valid get user request',
          withRequest: {
            method: 'GET',
            path: `${USER_PATH}/${params.username}`,
            headers: {'Accept': 'application/json'}
          },
          willRespondWith: {
            status: 404
          }
        }).then(() => done())
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should respond 404 if user not found', function (done) {

        adminusersClient.getUser(params).should.be.rejected.then(function (response) {
          expect(response.response.statusCode).to.equal(404);
        }).should.notify(done);
      });
    });

  });
});
