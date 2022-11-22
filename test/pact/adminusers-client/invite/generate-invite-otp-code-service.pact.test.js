'use strict'

const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const path = require('path')
const PactInteractionBuilder = require('../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const getAdminUsersClient = require('../../../../app/services/clients/adminusers.client')

// Constants
const INVITE_RESOURCE = '/v1/api/invites'
let adminUsersClient
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

describe('adminusers client - generate otp code for service invite', function () {
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

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/${inviteCode}/otp/generate`)
          .withState('a valid invite exists with the given invite code')
          .withUponReceiving('a valid generate service invite otp code request')
          .withMethod('POST')
          .withStatusCode(200)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should generate service invite otp code successfully', function (done) {
      adminUsersClient.generateInviteOtpCode(inviteCode).should.be.fulfilled.notify(done)
    })
  })

  describe('not found', () => {
    const nonExistingInviteCode = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/${nonExistingInviteCode}/otp/generate`)
          .withState('invite not exists for the given invite code')
          .withUponReceiving('a valid generate service invite otp code of a non existing invite')
          .withMethod('POST')
          .withStatusCode(404)
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should 404 NOT FOUND if service invite code not found', function (done) {
      adminUsersClient.generateInviteOtpCode(nonExistingInviteCode).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(404)
      }).should.notify(done)
    })
  })
})
