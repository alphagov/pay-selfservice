'use strict'

// NPM dependencies
const Pact = require('pact')
const path = require('path')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Local dependencies
const inviteFixtures = require('../../../../fixtures/invite_fixtures')
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers_client')
const PactInteractionBuilder = require('../../../../fixtures/pact_interaction_builder').PactInteractionBuilder
const expect = chai.expect

// Constants
const INVITES_PATH = '/v1/api/invites'
const port = Math.floor(Math.random() * 48127) + 1024
const adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${port}`})
const ssUserConfig = require('../../../../fixtures/config/self_service_user.json')

// Configure
chai.use(chaiAsPromised)

describe('adminusers client - get service invites', function () {
  let provider = Pact({
    consumer: 'selfservice-to-be',
    provider: 'adminusers',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  after((done) => provider.finalize().then(done()))

  describe('success', () => {
    const ssPlatformAdminUser = ssUserConfig.config.users.filter(fil => !fil.is_primary && fil.is_platform_admin)[0]
    const serviceExternalId = ssPlatformAdminUser.admin_service_roles.services[0].external_id
    const getServiceInviteResponse = inviteFixtures.validServiceInvitesResponse()

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(INVITES_PATH)
          .withState(`a service with id ${serviceExternalId} has valid invites`)
          .withMethod('GET')
          .withQuery('serviceId', serviceExternalId)
          .withUponReceiving('a valid get invite request')
          .withResponseBody(getServiceInviteResponse.getPactified())
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should find services invites successfully', function (done) {
      const expectedInviteData = getServiceInviteResponse.getPlain()

      adminusersClient.getInvitedUsersList(serviceExternalId).should.be.fulfilled.then(function (serviceInvites) {
        expect(serviceInvites).to.deep.equal(expectedInviteData)
      }).should.notify(done)
    })
  })
})
