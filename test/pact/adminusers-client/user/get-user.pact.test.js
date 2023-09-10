'use strict'

const { Pact } = require('@pact-foundation/pact')
const path = require('path')
const chai = require('chai')
const { expect } = chai
const chaiAsPromised = require('chai-as-promised')

const userFixtures = require('../../../fixtures/user.fixtures')
const getAdminUsersClient = require('../../../../app/services/clients/adminusers.client')
const PactInteractionBuilder = require('../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const { userResponsePactifier } = require('../../../test-helpers/pact/pactifier')

// constants
let adminUsersClient
const USER_PATH = '/v1/api/users'

chai.use(chaiAsPromised)

describe('adminusers client - get user', () => {
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

  describe('find a valid user', () => {
    const existingExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
    const getUserResponse = userFixtures.validUserResponse({ external_id: existingExternalId })

    before(done => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${existingExternalId}`)
          .withState(`a user exists with the given external id ${existingExternalId}`)
          .withUponReceiving('a valid get user request')
          .withResponseBody(userResponsePactifier.pactify(getUserResponse))
          .build()
      ).then(() => { done() })
    })

    afterEach(() => provider.verify())

    it('should find a user successfully', done => {
      adminUsersClient.getUserByExternalId(getUserResponse.external_id).should.be.fulfilled.then(user => {
        expect(user.externalId).to.be.equal(getUserResponse.external_id)
        expect(user.username).to.be.equal(getUserResponse.username)
        expect(user.email).to.be.equal(getUserResponse.email)
        expect(user.serviceRoles.length).to.be.equal(1)
        expect(user.serviceRoles[0].service.gatewayAccountIds.length).to.be.equal(1)
        expect(user.telephoneNumber).to.be.equal(getUserResponse.telephone_number)
        expect(user.otpKey).to.be.equal(getUserResponse.otp_key)
        expect(user.provisionalOtpKey).to.be.equal(getUserResponse.provisional_otp_key)
        expect(user.secondFactor).to.be.equal(getUserResponse.second_factor)
        expect(user.serviceRoles[0].role.permissions.length).to.be.equal(getUserResponse.service_roles[0].role.permissions.length)
      }).should.notify(done)
    })
  })

  describe('user not found', () => {
    const params = {
      external_id: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' // non existent external id
    }

    before(done => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${params.external_id}`)
          .withState('no user exists with the given external id')
          .withUponReceiving('a valid get user request of an non existing user')
          .withStatusCode(404)
          .withResponseHeaders({})
          .build()
      ).then(() => { done() })
    })

    afterEach(() => provider.verify())

    it('should respond 404 if user not found', done => {
      adminUsersClient.getUserByExternalId(params.external_id).should.be.rejected.then(response => {
        expect(response.errorCode).to.equal(404)
      }).should.notify(done)
    })
  })
})
