'use strict'

// npm dependencies
const Pact = require('pact')
const path = require('path')
const chai = require('chai')
const {expect} = chai
const chaiAsPromised = require('chai-as-promised')

// user dependencies
const userFixtures = require('../../../../fixtures/user_fixtures')
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers_client')
const PactInteractionBuilder = require('../../../../fixtures/pact_interaction_builder').PactInteractionBuilder

// constants
const port = Math.floor(Math.random() * 48127) + 1024
const adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${port}`})
const USER_PATH = '/v1/api/users'
const ssUserConfig = require('../../../../fixtures/config/self_service_user.json')

chai.use(chaiAsPromised)

describe('adminusers client - get platform admin user', function () {
  const provider = Pact({
    consumer: 'selfservice-to-be',
    provider: 'adminusers',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  const ssPlatformAdminUser = ssUserConfig.config.users.filter(fil => !fil.is_primary && fil.is_platform_admin)[0]

  before(() => provider.setup())
  after((done) => provider.finalize().then(done()))

  describe('success', () => {
    const existingExternalId = ssPlatformAdminUser.external_id

    const params = {
      external_id: existingExternalId
    }

    const getUserResponse = userFixtures.validPasswordAuthenticateResponse(ssPlatformAdminUser)

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${params.external_id}`)
          .withState(`a user exists with the given external id ${existingExternalId} and is a platform admin`)
          .withUponReceiving('a valid get user request for a platform admin')
          .withResponseBody(getUserResponse.getPactified())
          .build()
      ).then(done())
    })

    afterEach(() => provider.verify())

    it('should find a user successfully', function (done) {
      const expectedUserData = getUserResponse.getPlain()

      adminusersClient.getUserByExternalId(params.external_id).should.be.fulfilled.then(function (user) {
        expect(user.externalId).to.be.equal(expectedUserData.external_id)
        expect(user.isPlatformAdmin).to.be.equal(expectedUserData.is_platform_admin)
        expect(user.username).to.be.equal(expectedUserData.username)
        expect(user.email).to.be.equal(expectedUserData.email)
        expect(user.serviceRoles.length).to.be.equal(0)
        expect(user.telephoneNumber).to.be.equal(expectedUserData.telephone_number)
        expect(user.otpKey).to.be.equal(expectedUserData.otp_key)
        expect(user.provisionalOtpKey).to.be.equal(expectedUserData.provisional_otp_key)
        expect(user.secondFactor).to.be.equal(expectedUserData.second_factor)
      }).should.notify(done)
    })
  })
})
