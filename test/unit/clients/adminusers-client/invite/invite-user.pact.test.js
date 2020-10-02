const { Pact } = require('@pact-foundation/pact')
var path = require('path')
var getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
var inviteFixtures = require('../../../../fixtures/invite.fixtures')
var PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder

const INVITES_PATH = '/v1/api/invites/user'
const port = Math.floor(Math.random() * 48127) + 1024
const adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })

describe('adminusers client - invite user', () => {
  let externalServiceId = '12345'
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
    let validInvite = inviteFixtures.validInviteRequest({ externalServiceId: externalServiceId })

    beforeAll((done) => {
      let pactified = validInvite.getPactified()
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITES_PATH}`)
          .withUponReceiving('a valid user invite user request')
          .withMethod('POST')
          .withRequestBody(pactified)
          .withStatusCode(201)
          .withResponseBody(inviteFixtures.validInviteResponse(validInvite.getPlain()).getPactified())
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should create a invite successfully', () => {
      let invite = validInvite.getPlain()

      return adminusersClient.inviteUser(invite.email, invite.sender, externalServiceId, invite.role_name).then(function (inviteResponse) {
        expect(inviteResponse.email).toBe(invite.email)
      });
    })
  })

  describe('not found', () => {
    let nonExistentServiceId = '111111'
    let validInvite = inviteFixtures.validInviteRequest({ externalServiceId: nonExistentServiceId })

    beforeAll((done) => {
      let pactified = validInvite.getPactified()
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITES_PATH}`)
          .withUponReceiving('a valid user invite user request for a non-existent service')
          .withMethod('POST')
          .withRequestBody(pactified)
          .withStatusCode(404)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should return not found', () => {
      let invite = validInvite.getPlain()

      return adminusersClient.inviteUser(invite.email, invite.sender, nonExistentServiceId, invite.role_name)
        .then(
          () => { throw new Error('Expected to reject') },
          err => expect(err.errorCode).toBe(404)
        );
    })
  })

  describe('bad request', () => {
    let invalidInvite = inviteFixtures.invalidInviteRequest({ externalServiceId: externalServiceId })
    let errorResponse = inviteFixtures.invalidInviteCreateResponseWhenFieldsMissing()

    beforeAll((done) => {
      let pactified = invalidInvite.getPactified()

      provider.addInteraction(
        new PactInteractionBuilder(`${INVITES_PATH}`)
          .withUponReceiving('an invalid user invite user request for an empty invitee')
          .withMethod('POST')
          .withRequestBody(pactified)
          .withStatusCode(400)
          .withResponseBody(errorResponse.getPactified())
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should return bad request', () => {
      let invite = invalidInvite.getPlain()

      return adminusersClient.inviteUser(invite.email, invite.sender, externalServiceId, invite.role_name)
        .then(
          () => { throw new Error('Expected to reject') },
          (err) => {
            expect(err.errorCode).toBe(400)
            expect(err.message.errors.length).toBe(1)
            expect(err.message.errors).toEqual(errorResponse.getPlain().errors)
          }
        );
    })
  })

  describe('conflicting request', () => {
    let validInvite = inviteFixtures.validInviteRequest({ externalServiceId: externalServiceId })
    let errorResponse = inviteFixtures.conflictingInviteResponseWhenEmailUserAlreadyCreated(validInvite.getPlain().email).getPactified()

    beforeAll((done) => {
      let pactified = validInvite.getPactified()

      provider.addInteraction(
        new PactInteractionBuilder(`${INVITES_PATH}`)
          .withUponReceiving('a conflicting user invite user request for a valid invitee')
          .withMethod('POST')
          .withRequestBody(pactified)
          .withStatusCode(409)
          .withResponseBody(errorResponse.getPactified())
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should return conflict', () => {
      let invite = validInvite.getPlain()

      return adminusersClient.inviteUser(invite.email, invite.sender, externalServiceId, invite.role_name)
        .then(
          () => { throw new Error('Expected to reject') },
          (err) => {
            expect(err.errorCode).toBe(409)
            expect(err.message.errors.length).toBe(1)
            expect(err.message.errors).toEqual(errorResponse.getPlain().errors)
          }
        );
    })
  })

  describe('not permitted', () => {
    let validInvite = inviteFixtures.validInviteRequest({ externalServiceId: externalServiceId })
    let errorResponse = inviteFixtures.notPermittedInviteResponse(validInvite.getPlain().email, externalServiceId)

    beforeAll((done) => {
      let pactified = validInvite.getPactified()

      provider.addInteraction(
        new PactInteractionBuilder(`${INVITES_PATH}`)
          .withUponReceiving('a not permitted user invite user request for a valid invitee')
          .withMethod('POST')
          .withRequestBody(pactified)
          .withStatusCode(403)
          .withResponseBody(errorResponse.getPactified())
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should return not permitted', () => {
      let invite = validInvite.getPlain()

      return adminusersClient.inviteUser(invite.email, invite.sender, externalServiceId, invite.role_name)
        .then(
          () => { throw new Error('Expected to reject') },
          (err) => {
            expect(err.errorCode).toBe(403)
            expect(err.message.errors.length).toBe(1)
            expect(err.message.errors).toEqual(errorResponse.getPlain().errors)
          }
        );
    })
  })
})
