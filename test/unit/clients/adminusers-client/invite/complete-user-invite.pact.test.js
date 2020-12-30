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
let port = Math.floor(Math.random() * 48127) + 1024
let adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

describe('adminusers client - complete a user invite', function () {
  let provider = new Pact({
    consumer: 'selfservice-to-be',
    provider: 'adminusers',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  after(() => provider.finalize())

  describe('success', () => {
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

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/${inviteCode}/complete`)
          .withState('a valid user invite exists with the given invite code')
          .withUponReceiving('a valid complete user invite request')
          .withMethod('POST')
          .withStatusCode(200)
          .withResponseBody(pactify(validInviteCompleteResponse))
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should complete a service invite successfully', function (done) {
      adminusersClient.completeInvite('correlation-id', inviteCode).should.be.fulfilled.then(response => {
        expect(response.invite).to.deep.equal(validInviteCompleteResponse.invite)
        expect(response.user_external_id).to.equal(userExternalId)
        expect(response.service_external_id).to.equal(serviceExternalId)
      }).should.notify(done)
    })
  })

  describe('not found', () => {
    const nonExistingInviteCode = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/${nonExistingInviteCode}/complete`)
          .withState('invite not exists for the given invite code')
          .withUponReceiving('a valid complete user invite request of a non existing invite')
          .withMethod('POST')
          .withStatusCode(404)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should 404 NOT FOUND if invite code not found', function (done) {
      adminusersClient.completeInvite('correlation-id', nonExistingInviteCode).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(404)
      }).should.notify(done)
    })
  })

  describe('complete service invite - 410 GONE', () => {
    const inviteCode = '7d19aff33f8948deb97ed16b2912dcd3'

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/${inviteCode}/complete`)
          .withState('invite expired for the given invite code')
          .withUponReceiving('a valid complete service invite request with the user with same email exists')
          .withMethod('POST')
          .withStatusCode(410)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should 410 GONE if invite is expired', function (done) {
      adminusersClient.completeInvite('correlation-id', inviteCode).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(410)
      }).should.notify(done)
    })
  })
})
