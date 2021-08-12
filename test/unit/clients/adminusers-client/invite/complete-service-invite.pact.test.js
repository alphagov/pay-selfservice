'use strict'

const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const path = require('path')
const PactInteractionBuilder = require('../../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
const inviteFixtures = require('../../../../fixtures/invite.fixtures')
const { pactify } = require('../../../../test-helpers/pact/pactifier').defaultPactifier

// Constants
const INVITE_RESOURCE = '/v1/api/invites'
let adminUsersClient
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

describe('adminusers client - complete an invite', function () {
  let provider = new Pact({
    consumer: 'selfservice-to-be',
    provider: 'adminusers',
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(async () => {
    const opts = await provider.setup()
    adminUsersClient = getAdminUsersClient({ baseUrl: `http://localhost:${opts.port}` })
  })
  after(() => provider.finalize())

  describe('success', () => {
    const inviteCode = '7d19aff33f8948deb97ed16b2912dcd3'
    const userExternalId = 'f84b8210f93d455e97baeaf3fea72cf4'
    const serviceExternalId = '43a6818b522b4a628a14355614665ca3'

    const validInviteCompleteRequest = inviteFixtures.validInviteCompleteRequest()
    const validInviteCompleteResponse = inviteFixtures.validInviteCompleteResponse({
      invite: {
        code: inviteCode,
        type: 'service',
        disabled: true
      },
      user_external_id: userExternalId,
      service_external_id: serviceExternalId
    })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/${inviteCode}/complete`)
          .withState('a valid service invite exists with the given invite code')
          .withUponReceiving('a valid complete service invite request')
          .withMethod('POST')
          .withRequestBody(validInviteCompleteRequest)
          .withStatusCode(200)
          .withResponseBody(pactify(validInviteCompleteResponse))
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should complete a service invite successfully', function (done) {
      adminUsersClient.completeInvite('correlation-id', inviteCode).should.be.fulfilled.then(response => {
        expect(response.invite).to.deep.equal(validInviteCompleteResponse.invite)
        expect(response.user_external_id).to.equal(userExternalId)
        expect(response.service_external_id).to.equal(serviceExternalId)
      }).should.notify(done)
    })
  })

  describe('not found', () => {
    const nonExistingInviteCode = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'

    const gatewayAccountIds = ['1']
    const validInviteCompleteRequest = inviteFixtures.validInviteCompleteRequest({
      gateway_account_ids: gatewayAccountIds
    })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/${nonExistingInviteCode}/complete`)
          .withState('invite not exists for the given invite code')
          .withUponReceiving('a valid complete service invite request of a non existing invite')
          .withMethod('POST')
          .withRequestBody(validInviteCompleteRequest)
          .withStatusCode(404)
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should 404 NOT FOUND if invite code not found', function (done) {
      adminUsersClient.completeInvite('correlation-id', nonExistingInviteCode, gatewayAccountIds).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(404)
      }).should.notify(done)
    })
  })

  describe('complete service invite - 409 CONFLICT', () => {
    const inviteCode = '7d19aff33f8948deb97ed16b2912dcd3'

    const gatewayAccountIds = ['1']
    const validInviteCompleteRequest = inviteFixtures.validInviteCompleteRequest({
      gateway_account_ids: gatewayAccountIds
    })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/${inviteCode}/complete`)
          .withState('invite conflict for the given invite code')
          .withUponReceiving('a valid complete service invite request with the user with same email exists')
          .withMethod('POST')
          .withRequestBody(validInviteCompleteRequest)
          .withStatusCode(409)
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should 409 CONFLICT if user with same email exists', function (done) {
      adminUsersClient.completeInvite('correlation-id', inviteCode, gatewayAccountIds).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(409)
      }).should.notify(done)
    })
  })

  describe('bad request', () => {
    const inviteCode = '7d19aff33f8948deb97ed16b2912dcd3'

    const invalidGatewayAccountIds = ['non-numeric-id']
    const invalidInviteCompleteRequest = inviteFixtures.validInviteCompleteRequest({
      gateway_account_ids: invalidGatewayAccountIds
    })
    const errorResponse = inviteFixtures.badRequestResponseWhenNonNumericGatewayAccountIds(invalidGatewayAccountIds)

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/${inviteCode}/complete`)
          .withState('invite expired for the given invite code')
          .withUponReceiving('a valid complete service invite request of an expired invite')
          .withMethod('POST')
          .withRequestBody(invalidInviteCompleteRequest)
          .withStatusCode(400)
          .withResponseBody(pactify(errorResponse))
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should 400 BAD REQUEST if gateway accounts are non numeric', function (done) {
      adminUsersClient.completeInvite('correlation-id', inviteCode, invalidGatewayAccountIds).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(400)
      }).should.notify(done)
    })
  })
})
