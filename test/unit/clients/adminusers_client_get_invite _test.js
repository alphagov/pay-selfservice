let Pact = require('pact');
let helpersPath = __dirname + '/../../test_helpers/';
let pactProxy = require(helpersPath + '/pact_proxy.js');
let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let inviteFixtures = require(__dirname + '/../../fixtures/invite_fixtures');
let getAdminUsersClient = require('../../../app/services/clients/adminusers_client');
let PactInteractionBuilder = require(__dirname + '/../../fixtures/pact_interaction_builder').PactInteractionBuilder;

chai.use(chaiAsPromised);

const expect = chai.expect;

const INVITES_PATH = '/v1/api/invites';
let mockPort = Math.floor(Math.random() * 65535);
let mockServer = pactProxy.create('localhost', mockPort);
let adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${mockPort}`});

describe('adminusers client - get a validated invite', function () {

  let adminUsersMock;

  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000);
    mockServer.start().then(function () {
      adminUsersMock = Pact({consumer: 'Selfservice-get-invite', provider: 'AdminUsers', port: mockPort});
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

  describe('GET invite api', () => {

    context('GET invite api - success', () => {

      let inviteCode = '7d19aff33f8948deb97ed16b2912dcd3';

      let params = {
        invite_code: inviteCode,
        telephone_number: '0123456789'
      };


      let getInviteResponse = inviteFixtures.validInviteResponse(params);

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${INVITES_PATH}/${inviteCode}`)
            .withState('a valid invite exists with the given invite code')
            .withUponReceiving('a valid get invite request')
            .withResponseBody(getInviteResponse.getPactified())
            .build()
        ).then(() => done());
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should find an invite successfully', function (done) {
        let expectedInviteData = getInviteResponse.getPlain();

        adminusersClient.getValidatedInvite(params.invite_code).should.be.fulfilled.then(function(invite) {
          expect(invite.email).to.be.equal(expectedInviteData.email);
          expect(invite.telephone_number).to.be.equal(expectedInviteData.telephone_number);
        }).should.notify(done);
      });
    });

    context('GET invite api - expired', () => {

      let expiredCode = '7d19aff33f8948deb97ed16b2912dcd3';

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${INVITES_PATH}/${expiredCode}`)
            .withState('invite expired for the given invite code')
            .withUponReceiving('a valid get valid invite request of an expired invite')
            .withStatusCode(410)
            .withResponseHeaders({})
            .build()
        ).then(() => done());
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should respond 410 if invite expired', function (done) {

        adminusersClient.getValidatedInvite(expiredCode).should.be.rejected.then(function(response) {
          expect(response.errorCode).to.equal(410);
        }).should.notify(done);
      });
    });

    context('GET invite api - not found', () => {

      let nonExistingCode = '7d19aff33f8948deb97ed16b2912dcd3';

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${INVITES_PATH}/${nonExistingCode}`)
            .withState('invite not exists for the given invite code')
            .withUponReceiving('a valid get valid invite request of a non existing invite')
            .withStatusCode(404)
            .withResponseHeaders({})
            .build()
        ).then(() => done());
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should respond 404 if invite not found', function (done) {

        adminusersClient.getValidatedInvite(nonExistingCode).should.be.rejected.then(function(response) {
          expect(response.errorCode).to.equal(404);
        }).should.notify(done);
      });
    });

  });
});
