'use strict'

const { Pact } = require('@pact-foundation/pact')
const path = require('path')
const inviteFixtures = require('../../../../fixtures/invite.fixtures')
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
const PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder

const INVITES_PATH = '/v1/api/invites'
let port = Math.floor(Math.random() * 48127) + 1024
let adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })

describe('adminusers client - get a validated invite', () => {
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

    const params = {
      invite_code: inviteCode,
      telephone_number: '0123456789'
    }

    const getInviteResponse = inviteFixtures.validInviteResponse(params)

    beforeAll((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITES_PATH}/${inviteCode}`)
          .withState('a valid invite exists with the given invite code')
          .withUponReceiving('a valid get invite request')
          .withResponseBody(getInviteResponse.getPactified())
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should find an invite successfully', () => {
      const expectedInviteData = getInviteResponse.getPlain()

      return adminusersClient.getValidatedInvite(params.invite_code).then(function (invite) {
        expect(invite.email).toBe(expectedInviteData.email)
        expect(invite.telephone_number).toBe(expectedInviteData.telephone_number)
        expect(invite.type).toBe(expectedInviteData.type)
      });
    })
  })

  describe('expired', () => {
    const expiredCode = '7d19aff33f8948deb97ed16b2912dcd3'

    beforeAll((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITES_PATH}/${expiredCode}`)
          .withState('invite expired for the given invite code')
          .withUponReceiving('a valid get valid invite request of an expired invite')
          .withStatusCode(410)
          .withResponseHeaders({})
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should respond 410 if invite expired', () => {
      return adminusersClient.getValidatedInvite(expiredCode)
        .then(
          () => { throw new Error('Expected to reject') },
          err => expect(err.errorCode).toBe(410)
        );
    })
  })

  describe('not found', () => {
    const nonExistingCode = '7d19aff33f8948deb97ed16b2912dcd3'

    beforeAll((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITES_PATH}/${nonExistingCode}`)
          .withState('invite not exists for the given invite code')
          .withUponReceiving('a valid get valid invite request of a non existing invite')
          .withStatusCode(404)
          .withResponseHeaders({})
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should respond 404 if invite not found', () => {
      return adminusersClient.getValidatedInvite(nonExistingCode)
        .then(
          () => { throw new Error('Expected to reject') },
          err => expect(err.errorCode).toBe(404)
        );
    })
  })
})
