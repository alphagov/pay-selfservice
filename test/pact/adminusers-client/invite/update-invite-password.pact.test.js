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

describe('adminusers client - update invite password', function () {
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
    const password = 'a-valid-password'

    const validUpdateInvitePasswordRequest = inviteFixtures.validUpdateInvitePasswordRequest(password)

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`/v1/api/invites/${inviteCode}`)
          .withState('a valid self-signup invite exists with invite code an-invite-code')
          .withUponReceiving('a valid request to update the password for an invite')
          .withMethod('PATCH')
          .withRequestBody(validUpdateInvitePasswordRequest)
          .withStatusCode(200)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should update the password for an invite successfully', function (done) {
      adminUsersClient.updateInvitePassword(inviteCode, password).should.be.fulfilled.and.notify(done)
    })
  })
})
