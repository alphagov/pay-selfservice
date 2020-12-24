'use strict'

const { Pact } = require('@pact-foundation/pact')
const path = require('path')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const inviteFixtures = require('../../../../fixtures/invite.fixtures')
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
const PactInteractionBuilder = require('../../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const { pactify } = require('../../../../test-helpers/pact/pactifier').defaultPactifier

chai.use(chaiAsPromised)

const expect = chai.expect

const INVITES_PATH = '/v1/api/invites'
let port = Math.floor(Math.random() * 48127) + 1024
let adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })

describe('adminusers client - get a validated invite', function () {
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

    const params = {
      invite_code: inviteCode,
      telephone_number: '0123456789'
    }

    const getInviteResponse = inviteFixtures.validInviteResponse(params)

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITES_PATH}/${inviteCode}`)
          .withState('a valid invite exists with the given invite code')
          .withUponReceiving('a valid get invite request')
          .withResponseBody(pactify(getInviteResponse))
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should find an invite successfully', function (done) {
      adminusersClient.getValidatedInvite(params.invite_code).should.be.fulfilled.then(function (invite) {
        expect(invite.email).to.be.equal(getInviteResponse.email)
        expect(invite.telephone_number).to.be.equal(getInviteResponse.telephone_number)
        expect(invite.type).to.be.equal(getInviteResponse.type)
      }).should.notify(done)
    })
  })

  describe('expired', () => {
    const expiredCode = '7d19aff33f8948deb97ed16b2912dcd3'

    before((done) => {
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

    it('should respond 410 if invite expired', function (done) {
      adminusersClient.getValidatedInvite(expiredCode).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(410)
      }).should.notify(done)
    })
  })

  describe('not found', () => {
    const nonExistingCode = '7d19aff33f8948deb97ed16b2912dcd3'

    before((done) => {
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

    it('should respond 404 if invite not found', function (done) {
      adminusersClient.getValidatedInvite(nonExistingCode).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(404)
      }).should.notify(done)
    })
  })
})
