const { Pact } = require('@pact-foundation/pact')
const path = require('path')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const getAdminUsersClient = require('../../../../app/services/clients/adminusers.client')
const inviteFixtures = require('../../../fixtures/invite.fixtures')
const PactInteractionBuilder = require('../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const { pactify } = require('../../../test-helpers/pact/pactifier').defaultPactifier

chai.use(chaiAsPromised)

const expect = chai.expect
const INVITES_PATH = '/v1/api/invites/user'
let adminUsersClient

describe('adminusers client - invite user', function () {
  const externalServiceId = '12345'
  const provider = new Pact({
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

  describe('success', function () {
    const validInvite = inviteFixtures.validInviteRequest({ externalServiceId: externalServiceId })
    const response = inviteFixtures.validInviteResponse({ ...validInvite })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITES_PATH}`)
          .withUponReceiving('a valid user invite user request')
          .withMethod('POST')
          .withRequestBody(validInvite)
          .withStatusCode(201)
          .withResponseBody(pactify(response))
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should create a invite successfully', function (done) {
      adminUsersClient.inviteUser(validInvite.email, validInvite.sender, externalServiceId, validInvite.role_name).should.be.fulfilled.then(function (inviteResponse) {
        expect(inviteResponse.email).to.be.equal(validInvite.email)
      }).should.notify(done)
    })
  })

  describe('not found', () => {
    const nonExistentServiceId = '111111'
    const validInvite = inviteFixtures.validInviteRequest({ externalServiceId: nonExistentServiceId })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITES_PATH}`)
          .withUponReceiving('a valid user invite user request for a non-existent service')
          .withMethod('POST')
          .withRequestBody(validInvite)
          .withStatusCode(404)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should return not found', function (done) {
      adminUsersClient.inviteUser(validInvite.email, validInvite.sender, nonExistentServiceId, validInvite.role_name).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(404)
      }).should.notify(done)
    })
  })

  describe('bad request', () => {
    const invalidInvite = inviteFixtures.validInviteRequest({ externalServiceId: externalServiceId })
    const errorResponse = inviteFixtures.invalidInviteCreateResponseWhenFieldsMissing()

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITES_PATH}`)
          .withUponReceiving('an invalid user invite user request for an empty invitee')
          .withMethod('POST')
          .withRequestBody(invalidInvite)
          .withStatusCode(400)
          .withResponseBody(pactify(errorResponse))
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should return bad request', function (done) {
      adminUsersClient.inviteUser(invalidInvite.email, invalidInvite.sender, externalServiceId, invalidInvite.role_name).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(400)
        expect(response.message).to.equal(errorResponse.errors[0])
      }).should.notify(done)
    })
  })

  describe('conflicting request', () => {
    const validInvite = inviteFixtures.validInviteRequest({ externalServiceId: externalServiceId })
    const errorResponse = inviteFixtures.conflictingInviteResponseWhenEmailUserAlreadyCreated(validInvite.email)

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITES_PATH}`)
          .withUponReceiving('a conflicting user invite user request for a valid invitee')
          .withMethod('POST')
          .withRequestBody(validInvite)
          .withStatusCode(409)
          .withResponseBody(pactify(errorResponse))
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should return conflict', function (done) {
      adminUsersClient.inviteUser(validInvite.email, validInvite.sender, externalServiceId, validInvite.role_name).should.be.rejected.then(function (err) {
        expect(err.errorCode).to.equal(409)
        expect(err.message).to.equal(errorResponse.errors[0])
      }).should.notify(done)
    })
  })

  describe('not permitted', () => {
    const validInvite = inviteFixtures.validInviteRequest({ externalServiceId: externalServiceId })
    const errorResponse = inviteFixtures.notPermittedInviteResponse(validInvite.email, externalServiceId)

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITES_PATH}`)
          .withUponReceiving('a not permitted user invite user request for a valid invitee')
          .withMethod('POST')
          .withRequestBody(validInvite)
          .withStatusCode(403)
          .withResponseBody(pactify(errorResponse))
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should return not permitted', function (done) {
      adminUsersClient.inviteUser(validInvite.email, validInvite.sender, externalServiceId, validInvite.role_name).should.be.rejected.then(function (err) {
        expect(err.errorCode).to.equal(403)
        expect(err.message).to.equal(errorResponse.errors[0])
      }).should.notify(done)
    })
  })
})
