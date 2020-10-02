'use strict'

const { Pact } = require('@pact-foundation/pact')

const path = require('path')
const PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
const inviteFixtures = require('../../../../fixtures/invite.fixtures')

// Constants
const INVITE_RESOURCE = '/v1/api/invites'
let port = Math.floor(Math.random() * 48127) + 1024
let adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })

// Global setup

describe('adminusers client - complete a user invite', () => {
  let provider = new Pact({
    consumer: 'selfservice-to-be',
    provider: 'adminusers',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  beforeAll(() => provider.setup())
  afterAll(() => provider.finalize())

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

    beforeAll((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/${inviteCode}/complete`)
          .withState('a valid user invite exists with the given invite code')
          .withUponReceiving('a valid complete user invite request')
          .withMethod('POST')
          .withStatusCode(200)
          .withResponseBody(validInviteCompleteResponse.getPactified())
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should complete a service invite successfully', () => {
      const expectedData = validInviteCompleteResponse.getPlain()
      return adminusersClient.completeInvite(inviteCode).then(response => {
        expect(response.invite).toEqual(expectedData.invite)
        expect(response.user_external_id).toBe(userExternalId)
        expect(response.service_external_id).toBe(serviceExternalId)
      });
    })
  })

  describe('not found', () => {
    const nonExistingInviteCode = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'

    beforeAll((done) => {
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

    it('should 404 NOT FOUND if invite code not found', () => {
      return adminusersClient.completeInvite(nonExistingInviteCode)
        .then(
          () => { throw new Error('Expected to reject') },
          err => expect(err.errorCode).toBe(404)
        );
    })
  })

  describe('complete service invite - 410 GONE', () => {
    const inviteCode = '7d19aff33f8948deb97ed16b2912dcd3'

    beforeAll((done) => {
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

    it('should 410 GONE if invite is expired', () => {
      return adminusersClient.completeInvite(inviteCode)
        .then(
          () => { throw new Error('Expected to reject') },
          err => expect(err.errorCode).toBe(410)
        );
    })
  })
})
