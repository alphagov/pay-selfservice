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
const INVITES_PATH = '/v1/api/invites/create-invite-to-join-service'
const invitingUserExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
const existingServiceExternalId = 'cp5wa'
let adminUsersClient

describe('adminusers client - create invite to join service', function () {
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

  describe('success', function () {
    const validCreateInviteRequest = inviteFixtures.validCreateInviteToJoinServiceRequest({ externalServiceId: existingServiceExternalId, sender: invitingUserExternalId })
    const response = inviteFixtures.validInviteResponse({ ...validCreateInviteRequest })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITES_PATH}`)
          .withState(`a user exists with external id ${invitingUserExternalId} with admin role for service with id ${existingServiceExternalId}`)
          .withUponReceiving('a valid create invite to join service request')
          .withMethod('POST')
          .withRequestBody(validCreateInviteRequest)
          .withStatusCode(201)
          .withResponseBody(pactify(response))
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should create a invite successfully', function (done) {
      adminUsersClient.createInviteToJoinService(validCreateInviteRequest.email, validCreateInviteRequest.sender, existingServiceExternalId, validCreateInviteRequest.role_name).should.be.fulfilled.then(function (inviteResponse) {
        expect(inviteResponse.email).to.be.equal(validCreateInviteRequest.email)
      }).should.notify(done)
    })
  })
})
