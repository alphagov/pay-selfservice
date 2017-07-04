var Pact = require('pact');
_ = require('lodash');
var helpersPath = __dirname + '/../../test_helpers/';
var pactProxy = require(helpersPath + '/pact_proxy.js');
let User      = require('../../../app/models/user').User;
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var getAdminUsersClient = require('../../../app/services/clients/adminusers_client');
var userFixtures = require(__dirname + '/../../fixtures/user_fixtures');
var PactInteractionBuilder = require(__dirname + '/../../fixtures/pact_interaction_builder').PactInteractionBuilder;

chai.use(chaiAsPromised);

const expect = chai.expect;
const USER_RESOURCE = '/v1/api/users';
var mockPort = Math.floor(Math.random() * 65535);
var mockServer = pactProxy.create('localhost', mockPort);

var adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${mockPort}`});

describe('adminusers client - create a new user', function () {

  let adminUsersMock;

  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000);
    mockServer.start().then(function () {
      adminUsersMock = Pact({consumer: 'Selfservice-create-new-service', provider: 'adminusers', port: mockPort});
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

  describe('creating a user', function () {

    context('create a user - success', () => {
      const validRequest = userFixtures.validCreateUserRequest();
      const validCreateUserResponse = userFixtures.validUserResponse(validRequest.getPlain());

      beforeEach((done) => {
        let pactified = validRequest.getPactified();
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${USER_RESOURCE}`)
            .withUponReceiving('a valid create user request')
            .withMethod('POST')
            .withRequestBody(pactified)
            .withStatusCode(201)
            .withResponseBody(validCreateUserResponse.getPactified())
            .build()
        ).then(() => {
          done()
        }).catch(e =>
          console.log(e)
        );
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should create a new user', function (done) {
        let userData = validRequest.getPlain();
        adminusersClient.createUser(
          userData.email,
          userData.gateway_account_ids,
          userData.service_ids,
          userData.role_name,
          userData.telephone_number).should.be.fulfilled.then(user => {
          expect(user.username).to.be.equal(userData.username);
          expect(user.email).to.be.equal(userData.email);
          expect(_.isEqual(user.gatewayAccountIds, userData.gateway_account_ids)).to.be.equal(true);
          expect(user.telephoneNumber).to.be.equal(userData.telephone_number);
          expect(user.role.name).to.be.equal(userData.role_name);
        }).should.notify(done);
      });
    }),

    context('create a user - missing required fields', () => {
      const errorResponse = userFixtures.badRequestResponseWhenFieldsMissing(['username', 'email', 'gateway_account_ids', 'telephone_number', 'role_name'])

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${USER_RESOURCE}`)
            .withUponReceiving('a create user request missing required fields')
            .withMethod('POST')
            .withRequestBody({})
            .withStatusCode(400)
            .withResponseBody(errorResponse.getPactified())
            .build()
        ).then(() => {
          done()
        }).catch(e =>
          console.log(e)
        );
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should return a 400', function (done) {
        adminusersClient.createUser().should.be.rejected.then(response => {
          expect(response.errorCode).to.equal(400);
          expect(response.message.errors.length).to.equal(5);
          expect(response.message.errors).to.deep.equal(errorResponse.getPlain().errors);
        }).should.notify(done);
      });
    });
  });
});
