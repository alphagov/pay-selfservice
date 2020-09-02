'use strict'

const { Pact } = require('@pact-foundation/pact')
const path = require('path')
const chai = require('chai')
const { expect } = chai
const chaiAsPromised = require('chai-as-promised')

const userFixtures = require('../../../../fixtures/user.fixtures')
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
const PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder

// constants
const port = Math.floor(Math.random() * 48127) + 1024
const adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })
const USER_PATH = '/v1/api/users'

chai.use(chaiAsPromised)

describe('adminusers client - get user', () => {
  const provider = new Pact({
    consumer: 'selfservice',
    provider: 'adminusers',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  after(() => provider.finalize())

  describe('find a valid user', () => {
    const existingExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
    const getUserResponse = userFixtures.validUserResponse({ external_id: existingExternalId })

    before(done => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${existingExternalId}`)
          .withState(`a user exists with the given external id ${existingExternalId}`)
          .withUponReceiving('a valid get user request')
          .withResponseBody(getUserResponse.getPactified())
          .build()
      ).then(() => { done() })
    })

    afterEach(() => provider.verify())

    it('should find a user successfully', done => {
      const expectedUserData = getUserResponse.getPlain()

      adminusersClient.getUserByExternalId(expectedUserData.external_id).should.be.fulfilled.then(user => {
        expect(user.externalId).to.be.equal(expectedUserData.external_id)
        expect(user.username).to.be.equal(expectedUserData.username)
        expect(user.email).to.be.equal(expectedUserData.email)
        expect(user.serviceRoles.length).to.be.equal(1)
        expect(user.serviceRoles[0].service.gatewayAccountIds.length).to.be.equal(1)
        expect(user.telephoneNumber).to.be.equal(expectedUserData.telephone_number)
        expect(user.otpKey).to.be.equal(expectedUserData.otp_key)
        expect(user.provisionalOtpKey).to.be.equal(expectedUserData.provisional_otp_key)
        expect(user.secondFactor).to.be.equal(expectedUserData.second_factor)
        expect(user.serviceRoles[0].role.permissions.length).to.be.equal(expectedUserData.service_roles[0].role.permissions.length)
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
      adminusersClient.getUserByExternalId(params.external_id).should.be.rejected.then(response => {
        expect(response.errorCode).to.equal(404)
      }).should.notify(done)
    })
  })
})
