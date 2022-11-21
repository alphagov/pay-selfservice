'use strict'

const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const path = require('path')
const PactInteractionBuilder = require('../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const getAdminUsersClient = require('../../../../app/services/clients/adminusers.client')
const inviteFixtures = require('../../../fixtures/invite.fixtures')
const { pactify } = require('../../../test-helpers/pact/pactifier').defaultPactifier

// Constants
const INVITE_RESOURCE = '/v1/api/invites'
let adminUsersClient
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

describe('adminusers client - generate otp code for user invite', function () {
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
    const validRegistrationRequest = inviteFixtures.validRegistrationRequest()

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/${inviteCode}/otp/generate`)
          .withState('a valid invite exists with the given invite code')
          .withUponReceiving('a valid generate user invite otp code request')
          .withMethod('POST')
          .withRequestBody(pactify(validRegistrationRequest))
          .withStatusCode(200)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should generate user invite otp code successfully', function (done) {
      adminUsersClient.generateInviteOtpCode(inviteCode, validRegistrationRequest.telephone_number, validRegistrationRequest.password).should.be.fulfilled.notify(done)
    })
  })

  describe('bad request', () => {
    const inviteCode = '7d19aff33f8948deb97ed16b2912dcd3'
    const validRegistrationRequest = inviteFixtures.validRegistrationRequest()
    validRegistrationRequest.telephone_number = ''
    const errorResponse = inviteFixtures.badRequestResponseWhenFieldsMissing(['telephone_number'])

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/${inviteCode}/otp/generate`)
          .withState('a valid invite exists with the given invite code')
          .withUponReceiving('invalid generate user invite otp code request')
          .withMethod('POST')
          .withRequestBody(validRegistrationRequest)
          .withStatusCode(400)
          .withResponseBody(pactify(errorResponse))
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should 400 BAD REQUEST telephone number is not valid', function (done) {
      adminUsersClient.generateInviteOtpCode(inviteCode, validRegistrationRequest.telephone_number, validRegistrationRequest.password).should.be.rejected.then(function (err) {
        expect(err.errorCode).to.equal(400)
        expect(err.message).to.equal('Field [telephone_number] is required')
      }).should.notify(done)
    })
  })

  describe('not found', () => {
    const nonExistingInviteCode = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    const validRegistrationRequest = inviteFixtures.validRegistrationRequest()

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/${nonExistingInviteCode}/otp/generate`)
          .withState('invite not exists for the given invite code')
          .withUponReceiving('a valid generate user invite otp code of a non existing invite')
          .withMethod('POST')
          .withRequestBody(pactify(validRegistrationRequest))
          .withStatusCode(404)
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should 404 NOT FOUND if user invite code not found', function (done) {
      adminUsersClient.generateInviteOtpCode(nonExistingInviteCode, validRegistrationRequest.telephone_number, validRegistrationRequest.password).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(404)
      }).should.notify(done)
    })
  })
})
