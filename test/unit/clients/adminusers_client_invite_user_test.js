var Pact = require('pact');
var helpersPath = __dirname + '/../../test_helpers/';
var pactProxy = require(helpersPath + '/pact_proxy.js');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var getAdminUsersClient = require('../../../app/services/clients/adminusers_client');
var inviteFixtures = require(__dirname + '/../../fixtures/invite_fixtures');
var PactInteractionBuilder = require(__dirname + '/../../fixtures/pact_interaction_builder').PactInteractionBuilder;

chai.use(chaiAsPromised);

const expect = chai.expect;
const SERVICES_PATH = '/v1/api/services';
var mockPort = Math.floor(Math.random() * 65535);
var mockServer = pactProxy.create('localhost', mockPort);

var adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${mockPort}`});

describe('adminusers client - invite user', function () {

  let adminUsersMock;
  let serviceId = "12345";

  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000);
    mockServer.start().then(function () {
      adminUsersMock = Pact({consumer: 'Selfservice-invite-user', provider: 'AdminUsers', port: mockPort});
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

  describe('invite user API', function () {

    context('invite user API - success', () => {
      let validInvite = inviteFixtures.validInviteRequest();

      beforeEach((done) => {
        let pactified = validInvite.getPactified();
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${SERVICES_PATH}/${serviceId}/invites`)
            .withUponReceiving('a valid user invite user request')
            .withMethod('POST')
            .withRequestBody(pactified)
            .withStatusCode(201)
            .withResponseBody(inviteFixtures.validInviteResponse(validInvite.getPlain()).getPactified())
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

      it('should create a invite successfully', function (done) {
        let invite = validInvite.getPlain();

        adminusersClient.inviteUser(invite.email, invite.sender, serviceId, invite.role_name).should.be.fulfilled.then(function (inviteResponse) {
          expect(inviteResponse.email).to.be.equal(invite.email);

        }).should.notify(done);
      });
    });

    context('invite user API - service not found', () => {
      let validInvite = inviteFixtures.validInviteRequest();

      let nonExistentServiceId = "111111";

      beforeEach((done) => {
        let pactified = validInvite.getPactified();
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${SERVICES_PATH}/${nonExistentServiceId}/invites`)
            .withUponReceiving('a valid user invite user request for a non-existent service')
            .withMethod('POST')
            .withRequestBody(pactified)
            .withStatusCode(404)
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

      it('should return not found', function (done) {
        let invite = validInvite.getPlain();

        adminusersClient.inviteUser(invite.email, invite.sender, nonExistentServiceId, invite.role_name).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(404);
        }).should.notify(done);
      });
    });

    context('invite user API - bad request, should return error', () => {
      let invalidInvite = inviteFixtures.invalidInviteRequest();
      let errorResponse = inviteFixtures.invalidInviteCreateResponseWhenFieldsMissing();

      beforeEach((done) => {
        let pactified = invalidInvite.getPactified();

        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${SERVICES_PATH}/${serviceId}/invites`)
            .withUponReceiving('an invalid user invite user request for an empty invitee')
            .withMethod('POST')
            .withRequestBody(pactified)
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

      it('should return bad request', function (done) {
        let invite = invalidInvite.getPlain();

        adminusersClient.inviteUser(invite.email, invite.sender, serviceId, invite.role_name).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(400);
          expect(response.message.errors.length).to.equal(1);
          expect(response.message.errors).to.deep.equal(errorResponse.getPlain().errors);
        }).should.notify(done);
      });
    });

    context('invite user API - conflicting request, should return error', () => {
      let validInvite = inviteFixtures.validInviteRequest();
      let errorResponse = inviteFixtures.conflictingInviteResponseWhenEmailUserAlreadyCreated(validInvite.getPlain().email).getPactified();

      beforeEach((done) => {
        let pactified = validInvite.getPactified();

        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${SERVICES_PATH}/${serviceId}/invites`)
            .withUponReceiving('a conflicting user invite user request for a valid invitee')
            .withMethod('POST')
            .withRequestBody(pactified)
            .withStatusCode(409)
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

      it('should return conflict', function (done) {
        let invite = validInvite.getPlain();

        adminusersClient.inviteUser(invite.email, invite.sender, serviceId, invite.role_name).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(409);
          expect(response.message.errors.length).to.equal(1);
          expect(response.message.errors).to.deep.equal(errorResponse.getPlain().errors);
        }).should.notify(done);
      });
    });

    context('invite user API - not permitted for user, should return error', () => {
      let validInvite = inviteFixtures.validInviteRequest();
      let errorResponse = inviteFixtures.notPermittedInviteResponse(validInvite.getPlain().email, serviceId);

      beforeEach((done) => {
        let pactified = validInvite.getPactified();

        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${SERVICES_PATH}/${serviceId}/invites`)
            .withUponReceiving('a not permitted user invite user request for a valid invitee')
            .withMethod('POST')
            .withRequestBody(pactified)
            .withStatusCode(403)
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

      it('should return not permitted', function (done) {
        let invite = validInvite.getPlain();

        adminusersClient.inviteUser(invite.email, invite.sender, serviceId, invite.role_name).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(403);
          expect(response.message.errors.length).to.equal(1);
          expect(response.message.errors).to.deep.equal(errorResponse.getPlain().errors);
        }).should.notify(done);
      });
    });
  });
});
