'use strict';

const Pact = require('pact');
const helpersPath = '../../../test_helpers/';
const pactProxy = require(helpersPath + '/pact_proxy.js');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const inviteFixtures = require('../../../../fixtures/invite_fixtures');
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers_client');
const PactInteractionBuilder = require('../../../../fixtures/pact_interaction_builder').PactInteractionBuilder;

chai.use(chaiAsPromised);

const expect = chai.expect;

const INVITES_PATH = '/v1/api/invites';
const mockPort = Math.floor(Math.random() * 65535);
const mockServer = pactProxy.create('localhost', mockPort);
const adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${mockPort}`});

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

      const inviteCode = '7d19aff33f8948deb97ed16b2912dcd3';

      const params = {
        invite_code: inviteCode,
        telephone_number: '0123456789'
      };


      const getInviteResponse = inviteFixtures.validInviteResponse(params);

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
        const expectedInviteData = getInviteResponse.getPlain();

        adminusersClient.getValidatedInvite(params.invite_code).should.be.fulfilled.then(function(invite) {
          expect(invite.email).to.be.equal(expectedInviteData.email);
          expect(invite.telephone_number).to.be.equal(expectedInviteData.telephone_number);
          expect(invite.type).to.be.equal(expectedInviteData.type);
        }).should.notify(done);
      });
    });

    context('GET invite api - expired', () => {

      const expiredCode = '7d19aff33f8948deb97ed16b2912dcd3';

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

      const nonExistingCode = '7d19aff33f8948deb97ed16b2912dcd3';

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
