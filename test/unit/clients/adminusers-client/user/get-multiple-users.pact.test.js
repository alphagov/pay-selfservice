'use strict'
const { Pact } = require('@pact-foundation/pact')
let path = require('path')
const { expect } = require('chai')
let userFixtures = require('../../../../fixtures/user.fixtures')
let random = require('../../../../../app/utils/random')
let getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
let PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder
let port = Math.floor(Math.random() * 48127) + 1024
let adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })
const USER_PATH = '/v1/api/users'

describe('adminusers client - get users', function () {
  let provider = new Pact({
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
    let existingExternalIds = [
      random.randomUuid(),
      random.randomUuid()
    ]

    let params = existingExternalIds.map(existingExternalId => {
      return {
        external_id: existingExternalId,
        service_roles: [{
          service: {
            gateway_account_ids: ['666', '7']
          }
        }]
      }
    })

    let getUserResponse = userFixtures.validMultipleUserResponse(params)

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(USER_PATH)
          .withQuery('ids', existingExternalIds.join())
          .withState('the given external id all refer to existing users')
          .withUponReceiving('a valid get users request')
          .withResponseBody(getUserResponse.getPactified())
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should find users successfully', function () {
      const expectedUserData = getUserResponse.getPlain()

      return adminusersClient.getUsersByExternalIds(existingExternalIds)
        .then(function (users) {
          users.forEach((user, index) => {
            expect(user.externalId).to.be.equal(expectedUserData[index].external_id)
            expect(user.username).to.be.equal(expectedUserData[index].username)
            expect(user.email).to.be.equal(expectedUserData[index].email)
            expect(user.serviceRoles.length).to.be.equal(1)
            expect(user.serviceRoles[0].service.gatewayAccountIds.length).to.be.equal(2)
            expect(user.telephoneNumber).to.be.equal(expectedUserData[index].telephone_number)
            expect(user.otpKey).to.be.equal(expectedUserData[index].otp_key)
            expect(user.serviceRoles[0].role.permissions.length).to.be.equal(expectedUserData[index].service_roles[0].role.permissions.length)
          })
        })
    })
  })

  describe('not found', () => {
    let existingExternalIds = [
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
      return adminusersClient.getUsersByExternalIds(existingExternalIds)
        .then(
          () => { throw new Error('Expected to reject') },
          err => expect(err.errorCode).to.equal(404)
        )
    })
  })
})
