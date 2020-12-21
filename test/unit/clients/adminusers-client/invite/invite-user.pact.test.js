const { Pact } = require('@pact-foundation/pact')
const path = require('path')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
const inviteFixtures = require('../../../../fixtures/invite.fixtures')
const PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder

chai.use(chaiAsPromised)

const expect = chai.expect
const INVITES_PATH = '/v1/api/invites/user'
const port = Math.floor(Math.random() * 48127) + 1024
const adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })

describe('adminusers client - invite user', function () {
  const externalServiceId = '12345'
  const provider = new Pact({
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

  describe('success', function () {
    const validInvite = inviteFixtures.validInviteRequest({ externalServiceId: externalServiceId })

    before((done) => {
      const pactified = validInvite.getPactified()
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

    it('should create a invite successfully', function (done) {
      const invite = validInvite.getPlain()

      adminusersClient.inviteUser(invite.email, invite.sender, externalServiceId, invite.role_name).should.be.fulfilled.then(function (inviteResponse) {
        expect(inviteResponse.email).to.be.equal(invite.email)
      }).should.notify(done)
    })
  })

  describe('not found', () => {
    const nonExistentServiceId = '111111'
    const validInvite = inviteFixtures.validInviteRequest({ externalServiceId: nonExistentServiceId })

    before((done) => {
      const pactified = validInvite.getPactified()
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

    it('should return not found', function (done) {
      const invite = validInvite.getPlain()

      adminusersClient.inviteUser(invite.email, invite.sender, nonExistentServiceId, invite.role_name).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(404)
      }).should.notify(done)
    })
  })

  describe('bad request', () => {
    const invalidInvite = inviteFixtures.invalidInviteRequest({ externalServiceId: externalServiceId })
    const errorResponse = inviteFixtures.invalidInviteCreateResponseWhenFieldsMissing()

    before((done) => {
      const pactified = invalidInvite.getPactified()

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

    it('should return bad request', function (done) {
      const invite = invalidInvite.getPlain()

      adminusersClient.inviteUser(invite.email, invite.sender, externalServiceId, invite.role_name).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(400)
        expect(response.message.errors.length).to.equal(1)
        expect(response.message.errors).to.deep.equal(errorResponse.getPlain().errors)
      }).should.notify(done)
    })
  })

  describe('conflicting request', () => {
    const validInvite = inviteFixtures.validInviteRequest({ externalServiceId: externalServiceId })
    const errorResponse = inviteFixtures.conflictingInviteResponseWhenEmailUserAlreadyCreated(validInvite.getPlain().email).getPactified()

    before((done) => {
      const pactified = validInvite.getPactified()

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

    it('should return conflict', function (done) {
      const invite = validInvite.getPlain()

      adminusersClient.inviteUser(invite.email, invite.sender, externalServiceId, invite.role_name).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(409)
        expect(response.message.errors.length).to.equal(1)
        expect(response.message.errors).to.deep.equal(errorResponse.getPlain().errors)
      }).should.notify(done)
    })
  })

  describe('not permitted', () => {
    const validInvite = inviteFixtures.validInviteRequest({ externalServiceId: externalServiceId })
    const errorResponse = inviteFixtures.notPermittedInviteResponse(validInvite.getPlain().email, externalServiceId)

    before((done) => {
      const pactified = validInvite.getPactified()

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

    it('should return not permitted', function (done) {
      const invite = validInvite.getPlain()

      adminusersClient.inviteUser(invite.email, invite.sender, externalServiceId, invite.role_name).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(403)
        expect(response.message.errors.length).to.equal(1)
        expect(response.message.errors).to.deep.equal(errorResponse.getPlain().errors)
      }).should.notify(done)
    })
  })
})
