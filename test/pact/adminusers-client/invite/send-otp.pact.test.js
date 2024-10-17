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

// Global setup
chai.use(chaiAsPromised)

describe('adminusers client - send OTP code', function () {
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

  describe('success', () => {
    const inviteCode = 'an-invite-code'

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/${inviteCode}/send-otp`)
          .withState('a valid invite to add a user to a service exists with invite code an-invite-code')
          .withUponReceiving('a valid request to send an OTP code')
          .withMethod('POST')
          .withResponseHeaders({})
          .withStatusCode(204)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should send an OTP code successfully', function (done) {
      adminUsersClient.sendOtp(inviteCode).should.be.fulfilled.should.notify(done)
    })
  })
})
