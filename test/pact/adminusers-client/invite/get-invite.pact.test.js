'use strict'

const { Pact } = require('@pact-foundation/pact')
const path = require('path')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const inviteFixtures = require('../../../fixtures/invite.fixtures')
const getAdminUsersClient = require('../../../../app/services/clients/adminusers.client')
const PactInteractionBuilder = require('../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const { pactify } = require('../../../test-helpers/pact/pactifier').defaultPactifier

chai.use(chaiAsPromised)

const expect = chai.expect

const INVITES_PATH = '/v1/api/invites'
let adminUsersClient

describe('adminusers client - get an invite', function () {
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

    const getInviteResponse = inviteFixtures.validInviteResponse({
      telephone_number: '0123456789'
    })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITES_PATH}/${inviteCode}`)
          .withState('a valid invite to add a user to a service exists with invite code an-invite-code')
          .withUponReceiving('a valid get invite request')
          .withResponseBody(pactify(getInviteResponse))
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should find an invite successfully', function (done) {
      adminUsersClient.getValidatedInvite(inviteCode).should.be.fulfilled.then(function (invite) {
        expect(invite.email).to.be.equal(getInviteResponse.email)
        expect(invite.telephone_number).to.be.equal(getInviteResponse.telephone_number)
        expect(invite.type).to.be.equal(getInviteResponse.type)
        expect(invite.password_set).to.be.equal(getInviteResponse.password_set)
      }).should.notify(done)
    })
  })
})
