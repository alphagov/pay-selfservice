'use strict'

// NPM dependencies
const Pact = require('pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Custom dependencies
const pactProxy = require('../../../../test_helpers/pact_proxy')
const PactInteractionBuilder = require('../../../../fixtures/pact_interaction_builder').PactInteractionBuilder
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers_client')
const inviteFixtures = require('../../../../fixtures/invite_fixtures')

// Constants
const INVITE_RESOURCE = '/v1/api/invites'
const mockPort = Math.floor(Math.random() * 65535)
const mockServer = pactProxy.create('localhost', mockPort)
const adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${mockPort}`})
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

describe('adminusers client - complete a user invite', function () {
  let adminUsersMock

  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000)
    mockServer.start().then(function () {
      adminUsersMock = Pact({consumer: 'Selfservice-complete-user-invite', provider: 'adminusers', port: mockPort})
      done()
    })
  })

  /**
   * Remove the server and publish pacts to broker
   */
  after(function (done) {
    mockServer.delete()
      .then(() => pactProxy.removeAll())
      .then(() => done())
  })

  describe('complete user invite', function () {
    context('complete user invite - 200 OK', () => {
      const inviteCode = '7d19aff33f8948deb97ed16b2912dcd3'
      const userExternalId = 'f84b8210f93d455e97baeaf3fea72cf4'
      const serviceExternalId = '43a6818b522b4a628a14355614665ca3'
      const validInviteCompleteResponse = inviteFixtures.validInviteCompleteResponse({
        invite: {
          code: inviteCode,
          type: 'user',
          disabled: true
        },
        user_external_id: userExternalId,
        service_external_id: serviceExternalId
      })

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${INVITE_RESOURCE}/${inviteCode}/complete`)
            .withState('a valid user invite exists with the given invite code')
            .withUponReceiving('a valid complete user invite request')
            .withMethod('POST')
            .withStatusCode(200)
            .withResponseBody(validInviteCompleteResponse.getPactified())
            .build()
        ).then(() => {
          done()
        }).catch(e =>
          console.log(e)
        )
      })

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      })

      it('should complete a service invite successfully', function (done) {
        const expectedData = validInviteCompleteResponse.getPlain()
        adminusersClient.completeInvite(inviteCode).should.be.fulfilled.then(response => {
          expect(response.invite).to.deep.equal(expectedData.invite)
          expect(response.user_external_id).to.equal(userExternalId)
          expect(response.service_external_id).to.equal(serviceExternalId)
        }).should.notify(done)
      })
    })

    context('complete user invite - 404 NOT FOUND', () => {
      const nonExistingInviteCode = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${INVITE_RESOURCE}/${nonExistingInviteCode}/complete`)
            .withState('invite not exists for the given invite code')
            .withUponReceiving('a valid complete user invite request of a non existing invite')
            .withMethod('POST')
            .withStatusCode(404)
            .build()
        ).then(() => done())
      })

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      })

      it('should 404 NOT FOUND if invite code not found', function (done) {
        adminusersClient.completeInvite(nonExistingInviteCode).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(404)
        }).should.notify(done)
      })
    })

    context('complete service invite - 410 GONE', () => {
      const inviteCode = '7d19aff33f8948deb97ed16b2912dcd3'

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${INVITE_RESOURCE}/${inviteCode}/complete`)
            .withState('invite expired for the given invite code')
            .withUponReceiving('a valid complete service invite request with the user with same email exists')
            .withMethod('POST')
            .withStatusCode(410)
            .build()
        ).then(() => done())
      })

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      })

      it('should 410 GONE if invite is expired', function (done) {
        adminusersClient.completeInvite(inviteCode).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(410)
        }).should.notify(done)
      })
    })
  })
})
