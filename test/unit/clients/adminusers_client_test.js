var Pact = require('pact');
var helpersPath = __dirname + '/../../test_helpers/';
var pactProxy = require(helpersPath + '/pact_proxy.js');
var expect = require('chai').expect;

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

  describe('create user API', () => {

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

});
