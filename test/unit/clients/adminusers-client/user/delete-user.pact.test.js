const { Pact } = require('@pact-foundation/pact')
const path = require('path')
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
const PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const SERVICES_PATH = '/v1/api/services'
const port = Math.floor(Math.random() * 48127) + 1024
const adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })

describe('adminusers client - delete user', () => {
  let provider = new Pact({
    consumer: 'selfservice',
    provider: 'adminusers',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  beforeAll(() => provider.setup())
  afterAll(() => provider.finalize())

  const serviceId = 'pact-delete-service-id'
  const removerId = 'pact-delete-remover-id'
  const userId = 'pact-delete-user-id'

  describe('delete user API - success', () => {
    beforeAll((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICES_PATH}/${serviceId}/users/${userId}`)
          .withState('a user and user admin exists in service with the given ids before a delete operation')
          .withUponReceiving('a valid delete user from service request')
          .withMethod('DELETE')
          .withRequestHeaders({
            'Accept': 'application/json',
            'GovUkPay-User-Context': removerId
          })
          .withResponseHeaders({})
          .withStatusCode(204)
          .build())
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should delete a user successfully', () => {
      return adminusersClient.deleteUser(serviceId, removerId, userId)
    })
  })

  describe('delete user API - remove user itself - conflict', () => {
    beforeAll((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICES_PATH}/${serviceId}/users/${removerId}`)
          .withUponReceiving('a valid delete user from service request but remover is equal to user to be removed')
          .withMethod('DELETE')
          .withRequestHeaders({
            'Accept': 'application/json',
            'GovUkPay-User-Context': removerId
          })
          .withResponseHeaders({})
          .withStatusCode(409)
          .build())
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should conflict when remover and user to delete coincide', () => {
      return adminusersClient.deleteUser(serviceId, removerId, removerId)
        .then(
          () => { throw new Error('Expected to reject') },
          err => expect(err.errorCode).toBe(409)
        );
    })
  })

  describe('delete user API - user does not exist - not found', () => {
    const otherUserId = 'user-does-not-exist'

    beforeAll((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICES_PATH}/${serviceId}/users/${otherUserId}`)
          .withUponReceiving('an invalid delete user from service request as user does not exist')
          .withMethod('DELETE')
          .withRequestHeaders({
            'Accept': 'application/json',
            'GovUkPay-User-Context': removerId
          })
          .withResponseHeaders({})
          .withStatusCode(404)
          .build())
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it(
      'should return not found when resource is not found (user or service)',
      () => {
        return adminusersClient.deleteUser(serviceId, removerId, otherUserId)
          .then(
            () => { throw new Error('Expected to reject') },
            err => expect(err.errorCode).toBe(404)
          );
      }
    )
  })

  describe('delete user API - user context (remover) does not exist - forbidden', () => {
    const nonExistentRemoverId = 'user-does-not-exist'
    const serviceId = 'pact-service-no-remover-test'
    const userId = 'pact-user-no-remover-test'

    beforeAll((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICES_PATH}/${serviceId}/users/${userId}`)
          .withState('a user exists but not the remover before a delete operation')
          .withUponReceiving('a non existent user context')
          .withMethod('DELETE')
          .withRequestHeaders({
            'Accept': 'application/json',
            'GovUkPay-User-Context': nonExistentRemoverId
          })
          .withResponseHeaders({})
          .withStatusCode(403)
          .build())
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should return forbidden when remover dos not ex', () => {
      return adminusersClient.deleteUser(serviceId, nonExistentRemoverId, userId)
        .then(
          () => { throw new Error('Expected to reject') },
          err => expect(err.errorCode).toBe(403)
        );
    })
  })
})
