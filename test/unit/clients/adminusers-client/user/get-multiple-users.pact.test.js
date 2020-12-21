'use strict'
const { Pact } = require('@pact-foundation/pact')
const path = require('path')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const userFixtures = require('../../../../fixtures/user.fixtures')
const random = require('../../../../../app/utils/random')
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
const PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const port = Math.floor(Math.random() * 48127) + 1024
const adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })
const { userResponsePactifier } = require('../../../../test-helpers/pact/pactifier')

chai.use(chaiAsPromised)

const { expect } = chai
const USER_PATH = '/v1/api/users'

describe('adminusers client - get users', function () {
  const provider = new Pact({
    consumer: 'selfservice-to-be',
    provider: 'adminusers',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  after(() => provider.finalize())

  describe('success', () => {
    const existingExternalIds = [
      random.randomUuid(),
      random.randomUuid()
    ]

    const params = existingExternalIds.map(existingExternalId => {
      return {
        external_id: existingExternalId,
        service_roles: [{
          service: {
            gateway_account_ids: ['666', '7']
          }
        }]
      }
    })

    const expectedUsers = userFixtures.validMultipleUserResponse(params)
    const usersPactified = userResponsePactifier.pactifySimpleArray(expectedUsers)

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(USER_PATH)
          .withQuery('ids', existingExternalIds.join())
          .withState('the given external id all refer to existing users')
          .withUponReceiving('a valid get users request')
          .withResponseBody(usersPactified)
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should find users successfully', function () {
      const result = expect(adminusersClient.getUsersByExternalIds(existingExternalIds))

      return result.to.be.fulfilled.then(function (users) {
        users.forEach((user, index) => {
          expect(user.externalId).to.be.equal(expectedUsers[index].external_id)
          expect(user.username).to.be.equal(expectedUsers[index].username)
          expect(user.email).to.be.equal(expectedUsers[index].email)
          expect(user.serviceRoles.length).to.be.equal(1)
          expect(user.serviceRoles[0].service.gatewayAccountIds.length).to.be.equal(2)
          expect(user.telephoneNumber).to.be.equal(expectedUsers[index].telephone_number)
          expect(user.otpKey).to.be.equal(expectedUsers[index].otp_key)
          expect(user.serviceRoles[0].role.permissions.length).to.be.equal(expectedUsers[index].service_roles[0].role.permissions.length)
        })
      })
    })
  })

  describe('not found', () => {
    const existingExternalIds = [
      random.randomUuid(),
      random.randomUuid()
    ]

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(USER_PATH)
          .withQuery('ids', existingExternalIds.join())
          .withState('no users exits with the given external id')
          .withUponReceiving('a valid get users request of an non existing user')
          .withStatusCode(404)
          .withResponseHeaders({})
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should respond 404 if user not found', function () {
      return expect(adminusersClient.getUsersByExternalIds(existingExternalIds)).to.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(404)
      })
    })
  })
})
