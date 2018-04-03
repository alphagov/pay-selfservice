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

describe('adminusers client - complete an invite', function () {
  let adminUsersMock

  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000)
    mockServer.start().then(function () {
      adminUsersMock = Pact({consumer: 'selfservice', provider: 'adminusers', port: mockPort, pactfileWriteMode: 'merge'})
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

  describe('complete service invite', function () {
    context('complete service invite - 200 OK', () => {
      const inviteCode = '7d19aff33f8948deb97ed16b2912dcd3'
      const userExternalId = 'f84b8210f93d455e97baeaf3fea72cf4'
      const serviceExternalId = '43a6818b522b4a628a14355614665ca3'

      const gatewayAccountIds = ['1']
      const validInviteCompleteRequest = inviteFixtures.validInviteCompleteRequest({
        gateway_account_ids: gatewayAccountIds
      })
      const validInviteCompleteResponse = inviteFixtures.validInviteCompleteResponse({
        invite: {
          code: inviteCode,
          type: 'service',
          disabled: true
        },
        user_external_id: userExternalId,
        service_external_id: serviceExternalId
      })

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${INVITE_RESOURCE}/${inviteCode}/complete`)
            .withState('a valid service invite exists with the given invite code')
            .withUponReceiving('a valid complete service invite request')
            .withMethod('POST')
            .withRequestBody(validInviteCompleteRequest.getPactified())
            .withStatusCode(200)
            .withResponseBody(validInviteCompleteResponse.getPactified())
            .build()
        )
          .then(() => done())
          .catch(done)
      })

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      })

      it('should complete a service invite successfully', function (done) {
        const expectedData = validInviteCompleteResponse.getPlain()
        adminusersClient.completeInvite(inviteCode, gatewayAccountIds).should.be.fulfilled.then(response => {
          expect(response.invite).to.deep.equal(expectedData.invite)
          expect(response.user_external_id).to.equal(userExternalId)
          expect(response.service_external_id).to.equal(serviceExternalId)
        }).should.notify(done)
      })
    })

    context('complete service invite - 404 NOT FOUND', () => {
      const nonExistingInviteCode = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'

      const gatewayAccountIds = ['1']
      const validInviteCompleteRequest = inviteFixtures.validInviteCompleteRequest({
        gateway_account_ids: gatewayAccountIds
      })

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${INVITE_RESOURCE}/${nonExistingInviteCode}/complete`)
            .withState('invite not exists for the given invite code')
            .withUponReceiving('a valid complete service invite request of a non existing invite')
            .withMethod('POST')
            .withRequestBody(validInviteCompleteRequest.getPactified())
            .withStatusCode(404)
            .build()
        ).then(() => done())
      })

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      })

      it('should 404 NOT FOUND if invite code not found', function (done) {
        adminusersClient.completeInvite(nonExistingInviteCode, gatewayAccountIds).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(404)
        }).should.notify(done)
      })
    })

    context('complete service invite - 409 CONFLICT', () => {
      const inviteCode = '7d19aff33f8948deb97ed16b2912dcd3'

      const gatewayAccountIds = ['1']
      const validInviteCompleteRequest = inviteFixtures.validInviteCompleteRequest({
        gateway_account_ids: gatewayAccountIds
      })

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${INVITE_RESOURCE}/${inviteCode}/complete`)
            .withState('invite conflict for the given invite code')
            .withUponReceiving('a valid complete service invite request with the user with same email exists')
            .withMethod('POST')
            .withRequestBody(validInviteCompleteRequest.getPactified())
            .withStatusCode(409)
            .build()
        ).then(() => done())
      })

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      })

      it('should 409 CONFLICT if user with same email exists', function (done) {
        adminusersClient.completeInvite(inviteCode, gatewayAccountIds).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(409)
        }).should.notify(done)
      })
    })

    context('complete service invite - 400 BAD REQUEST', () => {
      const inviteCode = '7d19aff33f8948deb97ed16b2912dcd3'

      const invalidGatewayAccountIds = ['non-numeric-id']
      const invalidInviteCompleteRequest = inviteFixtures.validInviteCompleteRequest({
        gateway_account_ids: invalidGatewayAccountIds
      })
      const errorResponse = inviteFixtures.badRequestResponseWhenNonNumericGatewayAccountIds(invalidGatewayAccountIds)

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${INVITE_RESOURCE}/${inviteCode}/complete`)
            .withState('invite expired for the given invite code')
            .withUponReceiving('a valid complete service invite request of an expired invite')
            .withMethod('POST')
            .withRequestBody(invalidInviteCompleteRequest.getPactified())
            .withStatusCode(400)
            .withResponseBody(errorResponse.getPactified())
            .build()
        ).then(() => done())
      })

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      })

      it('should 400 BAD REQUEST if gateway accounts are non numeric', function (done) {
        adminusersClient.completeInvite(inviteCode, invalidGatewayAccountIds).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(400)
        }).should.notify(done)
      })
    })
  })
})
