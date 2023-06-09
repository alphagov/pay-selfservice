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
const expect = chai.expect
const INVITE_RESOURCE = '/v1/api/invites'
let adminUsersClient

// Global setup
chai.use(chaiAsPromised)

describe('adminusers client - re-provision OTP key', function () {
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
    adminUsersClient = getAdminUsersClient({ baseUrl: `http://localhost:${opts.port}` })
  })
  after(() => provider.finalize())

  describe('success', () => {
    const inviteCode = 'an-invite-code'

    const reprovisionOtpResponse = inviteFixtures.validInviteResponse()

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/${inviteCode}/reprovision-otp`)
          .withState('a valid invite to add a user to a service exists with invite code an-invite-code')
          .withUponReceiving('a valid request to re-provision an OTP key')
          .withMethod('POST')
          .withStatusCode(200)
          .withResponseBody(pactify(reprovisionOtpResponse))
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should re-provision an OTP key successfully', function (done) {
      adminUsersClient.reprovisionOtp(inviteCode).should.be.fulfilled.then(function (invite) {
        expect(invite.otp_key).to.be.equal(reprovisionOtpResponse.otp_key)
      }).should.notify(done)
    })
  })
})
