'use strict'

const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const path = require('path')
const PactInteractionBuilder = require('../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const getAdminUsersClient = require('../../../../app/services/clients/adminusers.client')
const inviteFixtures = require('../../../fixtures/invite.fixtures')

// Global setup
chai.use(chaiAsPromised)

let adminUsersClient

describe('adminusers client - update invite phone number', function () {
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
    const phoneNumber = '+44 0808 157 0192'

    const validUpdateInvitePhoneNumberRequest = inviteFixtures.validUpdateInvitePhoneNumberRequest(phoneNumber)

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`/v1/api/invites/${inviteCode}`)
          .withState('a valid self-signup invite exists with invite code an-invite-code')
          .withUponReceiving('a valid request to update the phone number for an invite')
          .withMethod('PATCH')
          .withRequestBody(validUpdateInvitePhoneNumberRequest)
          .withStatusCode(200)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should update the phone number for an invite successfully', function (done) {
      adminUsersClient.updateInvitePhoneNumber(inviteCode, phoneNumber).should.be.fulfilled.and.notify(done)
    })
  })
})
