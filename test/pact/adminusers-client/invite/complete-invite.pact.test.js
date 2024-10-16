'use strict'

const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const path = require('path')
const PactInteractionBuilder = require('../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const getAdminUsersClient = require('../../../../app/services/clients/adminusers.client')
const inviteFixtures = require('../../../fixtures/invite.fixtures')
const secondFactorMethod = require('../../../../app/models/second-factor-method')
const { pactify } = require('../../../test-helpers/pact/pactifier').defaultPactifier

// Constants
const INVITE_RESOURCE = '/v1/api/invites'
let adminUsersClient
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

describe('adminusers client - complete an invite', function () {
  const provider = new Pact({
    consumer: 'selfservice',
    provider: 'adminusers',
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(async () => {
    const opts = await provider.setup()
    adminUsersClient = getAdminUsersClient({ baseUrl: `http://127.0.0.1:${opts.port}` })
  })
  after(() => provider.finalize())

  describe('success for a self-signup invite', () => {
    const inviteCode = 'an-invite-code'
    const userExternalId = 'f84b8210f93d455e97baeaf3fea72cf4'

    const validInviteCompleteRequest = inviteFixtures.validInviteCompleteRequest(secondFactorMethod.APP)
    const validInviteCompleteResponse = inviteFixtures.inviteCompleteResponseWithNoServiceExternalId({
      user_external_id: userExternalId
    })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/${inviteCode}/complete`)
          .withState('a valid self-signup invite exists with invite code an-invite-code')
          .withUponReceiving('a valid request to complete a self-signup invite')
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
      adminUsersClient.completeInvite(inviteCode, secondFactorMethod.APP).should.be.fulfilled.then(response => {
        expect(response.user_external_id).to.equal(userExternalId)
      }).should.notify(done)
    })
  })

  describe('success for inviting a new user to a service', () => {
    const inviteCode = 'an-invite-code'
    const userExternalId = 'f84b8210f93d455e97baeaf3fea72cf4'
    const serviceExternalId = '43a6818b522b4a628a14355614665ca3'

    const validInviteCompleteRequest = inviteFixtures.validInviteCompleteRequest(secondFactorMethod.APP)
    const validInviteCompleteResponse = inviteFixtures.validInviteCompleteResponse({
      user_external_id: userExternalId,
      service_external_id: serviceExternalId
    })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/${inviteCode}/complete`)
          .withState('a valid invite to add a user to a service exists with invite code an-invite-code')
          .withUponReceiving('a valid request to complete an invite to add a user to a service')
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
      adminUsersClient.completeInvite(inviteCode, secondFactorMethod.APP).should.be.fulfilled.then(response => {
        expect(response.user_external_id).to.equal(userExternalId)
        expect(response.service_external_id).to.equal(serviceExternalId)
      }).should.notify(done)
    })
  })

  describe('success for inviting an existing user to a service', () => {
    const inviteCode = 'an-invite-code'
    const userExternalId = 'f84b8210f93d455e97baeaf3fea72cf4'
    const serviceExternalId = '43a6818b522b4a628a14355614665ca3'

    const validInviteCompleteResponse = inviteFixtures.validInviteCompleteResponse({
      user_external_id: userExternalId,
      service_external_id: serviceExternalId
    })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/${inviteCode}/complete`)
          .withState('an invite to add an existing user to a service exists with invite code an-invite-code')
          .withUponReceiving('a valid request to complete an invite to add an existing user to a service')
          .withMethod('POST')
          .withRequestBody(null)
          .withStatusCode(200)
          .withResponseBody(pactify(validInviteCompleteResponse))
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should complete a service invite successfully', function (done) {
      adminUsersClient.completeInvite(inviteCode).should.be.fulfilled.then(response => {
        expect(response.user_external_id).to.equal(userExternalId)
        expect(response.service_external_id).to.equal(serviceExternalId)
      }).should.notify(done)
    })
  })
})
