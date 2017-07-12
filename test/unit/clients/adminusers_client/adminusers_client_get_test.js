let Pact = require('pact');
let helpersPath =  '../../../test_helpers/';
let pactProxy = require(helpersPath + '/pact_proxy.js');
let chai = require('chai');
let _ = require('lodash');
let chaiAsPromised = require('chai-as-promised');
let userFixtures = require('../../../fixtures/user_fixtures');
let getAdminUsersClient = require('../../../../app/services/clients/adminusers_client');
let PactInteractionBuilder = require('../../../fixtures/pact_interaction_builder').PactInteractionBuilder;

chai.use(chaiAsPromised);

const expect = chai.expect;

const USER_PATH = '/v1/api/users';
let mockPort = Math.floor(Math.random() * 65535);
let mockServer = pactProxy.create('localhost', mockPort);
let adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${mockPort}`});

describe('adminusers client - get user', function () {

  let adminUsersMock;

  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000);
    mockServer.start().then(function () {
      adminUsersMock = Pact({consumer: 'Selfservice-get-user', provider: 'AdminUsers', port: mockPort});
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

  describe('GET user api', () => {

    context('GET user api - success', () => {

      let existingExternalId = '7d19aff33f8948deb97ed16b2912dcd3';

      let params = {
        external_id: existingExternalId,
        gateway_account_ids: ['666', '7']
      };

      let getUserResponse = userFixtures.validUserResponse(params);

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${USER_PATH}/${params.external_id}`)
            .withState('a user exits with the given external id')
            .withUponReceiving('a valid get user request')
            .withResponseBody(getUserResponse.getPactified())
            .build()
        ).then(() => done());
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should find a user successfully', function (done) {
        let expectedUserData = getUserResponse.getPlain();

        adminusersClient.getUserByExternalId(params.external_id).should.be.fulfilled.then(function(user) {
          expect(user.externalId).to.be.equal(expectedUserData.external_id);
          expect(user.username).to.be.equal(expectedUserData.username);
          expect(user.email).to.be.equal(expectedUserData.email);
          expect(user.gatewayAccountIds.length).to.be.equal(2);
          expect(user.serviceRoles.length).to.be.equal(1);
          expect(user.serviceRoles[0].service.gatewayAccountIds.length).to.be.equal(2);
          expect(user.telephoneNumber).to.be.equal(expectedUserData.telephone_number);
          expect(user.otpKey).to.be.equal(expectedUserData.otp_key);
          expect(user.role.name).to.be.equal(expectedUserData.role.name);
          expect(user.permissions.length).to.be.equal(expectedUserData.permissions.length);
        }).should.notify(done);
      });
    });

    context('GET user api - not found', () => {

      let params = {
        external_id: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' // non existent external id
      };

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${USER_PATH}/${params.external_id}`)
            .withState('no user exits with the given external id')
            .withUponReceiving('a valid get user request of an non existing user')
            .withStatusCode(404)
            .withResponseHeaders({})
            .build()
        ).then(() => done());
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should respond 404 if user not found', function (done) {

        adminusersClient.getUserByExternalId(params.external_id).should.be.rejected.then(function(response) {
          expect(response.errorCode).to.equal(404);
        }).should.notify(done);
      });
    });

  });
});
