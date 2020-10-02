'use strict'
const { Pact } = require('@pact-foundation/pact')
let path = require('path')
let userFixtures = require('../../../../fixtures/user.fixtures')
let random = require('../../../../../app/utils/random')
let getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
let PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder
let port = Math.floor(Math.random() * 48127) + 1024
let adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })
const USER_PATH = '/v1/api/users'

describe('adminusers client - get users', () => {
  let provider = new Pact({
    consumer: 'selfservice-to-be',
    provider: 'adminusers',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  beforeAll(() => provider.setup())
  afterAll(() => provider.finalize())

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

    beforeAll((done) => {
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

    it('should find users successfully', () => {
      const expectedUserData = getUserResponse.getPlain()

      return adminusersClient.getUsersByExternalIds(existingExternalIds)
        .then(function (users) {
          users.forEach((user, index) => {
            expect(user.externalId).toBe(expectedUserData[index].external_id)
            expect(user.username).toBe(expectedUserData[index].username)
            expect(user.email).toBe(expectedUserData[index].email)
            expect(user.serviceRoles.length).toBe(1)
            expect(user.serviceRoles[0].service.gatewayAccountIds.length).toBe(2)
            expect(user.telephoneNumber).toBe(expectedUserData[index].telephone_number)
            expect(user.otpKey).toBe(expectedUserData[index].otp_key)
            expect(user.serviceRoles[0].role.permissions.length).toBe(expectedUserData[index].service_roles[0].role.permissions.length)
          })
        });
    })
  })

  describe('not found', () => {
    let existingExternalIds = [
      random.randomUuid(),
      random.randomUuid()
    ]

    beforeAll((done) => {
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

    it('should respond 404 if user not found', () => {
      return adminusersClient.getUsersByExternalIds(existingExternalIds)
        .then(
          () => { throw new Error('Expected to reject') },
          err => expect(err.errorCode).toBe(404)
        );
    })
  })
})
