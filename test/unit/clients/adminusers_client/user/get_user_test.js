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

describe('adminusers client - get user', function () {
  let provider = Pact({
    consumer: 'selfservice',
    provider: 'adminusers',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  // Use a known configuration to generate our interaction. This configuration is used in browser testing
  // where assumptions about users and stubs are relied upon upfront
  const ssUser = ssUserConfig.config.users.filter(fil => fil.isPrimary === 'true')[0]

  before(() => provider.setup())
  after((done) => provider.finalize().then(done()))

  describe('success', () => {
    const existingExternalId = ssUser.external_id

    const params = {
      external_id: existingExternalId,
      gateway_account_ids: ssUser.gateway_accounts.map(gam => gam.id),
      permissions: ssUser.permissions
    }

    const getUserResponse = userFixtures.validUserResponse(params)

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${params.external_id}`)
          .withState('a user exists with the given external id ' + existingExternalId)
          .withUponReceiving('a valid get user request')
          .withResponseBody(getUserResponse.getPactified())
          .build()
      ).then(done())
    })

    afterEach(() => provider.verify())

    it('should find a user successfully', function (done) {
      const expectedUserData = getUserResponse.getPlain()

      adminusersClient.getUserByExternalId(params.external_id).should.be.fulfilled.then(function (user) {
        expect(user.externalId).to.be.equal(expectedUserData.external_id)
        expect(user.username).to.be.equal(expectedUserData.username)
        expect(user.email).to.be.equal(expectedUserData.email)
        expect(user.serviceRoles.length).to.be.equal(1)
        expect(user.serviceRoles[0].service.gatewayAccountIds.length).to.be.equal(2)
        expect(user.telephoneNumber).to.be.equal(expectedUserData.telephone_number)
        expect(user.otpKey).to.be.equal(expectedUserData.otp_key)
        expect(user.provisionalOtpKey).to.be.equal(expectedUserData.provisional_otp_key)
        expect(user.secondFactor).to.be.equal(expectedUserData.second_factor)
        expect(user.serviceRoles[0].role.permissions.length).to.be.equal(expectedUserData.service_roles[0].role.permissions.length)
      }).should.notify(done)
    })
  })

  describe('not found', () => {
    const params = {
      external_id: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' // non existent external id
    }

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${params.external_id}`)
          .withState('no user exists with the given external id')
          .withUponReceiving('a valid get user request of an non existing user')
          .withStatusCode(404)
          .withResponseHeaders({})
          .build()
      ).then(done())
    })

    afterEach(() => provider.verify())

    it('should respond 404 if user not found', function (done) {
      adminusersClient.getUserByExternalId(params.external_id).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(404)
      }).should.notify(done)
    })
  })
})
