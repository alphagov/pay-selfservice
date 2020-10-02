'use strict'

const { Pact } = require('@pact-foundation/pact')
const path = require('path')

const getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
const userServiceFixtures = require('../../../../fixtures/user-service.fixture')
const PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder

// Global setup

// Constants
const SERVICES_PATH = '/v1/api/services'
const port = Math.floor(Math.random() * 48127) + 1024
const adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })

const existingServiceExternalId = 'cp5wa'

describe('adminusers client - service users', () => {
  const provider = new Pact({
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

  describe('single user is returned for service', () => {
    const getServiceUsersResponse = userServiceFixtures.validServiceUsersResponse([{
      service_roles: [{
        service: {
          external_id: existingServiceExternalId
        }
      }]
    }])

    beforeAll(done => {
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICES_PATH}/${existingServiceExternalId}/users`)
          .withUponReceiving('a valid get service users request')
          .withState(`a user exists with role for service with id ${existingServiceExternalId}`)
          .withResponseBody(getServiceUsersResponse.getPactified())
          .withStatusCode(200)
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should return service users successfully', () => {
      return adminusersClient.getServiceUsers(existingServiceExternalId).then(
        users => {
          const expectedResponse = getServiceUsersResponse.getPlain()
          expect(users[0].serviceRoles.length).toBe(expectedResponse[0].service_roles.length)
          expect(users[0].hasService(existingServiceExternalId)).toBe(true)
        }
      );
    })
  })

  describe('service does not exist', () => {
    const nonExistingServiceId = '500'
    beforeAll(done => {
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICES_PATH}/${nonExistingServiceId}/users`)
          .withUponReceiving('a valid get service users request with non-existing service id')
          .withStatusCode(404)
          .withResponseHeaders({})
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should return service not found', () => {
      return adminusersClient.getServiceUsers(nonExistingServiceId)
        .then(
          () => { throw new Error('Expected to reject') },
          err => expect(err.errorCode).toBe(404)
        );
    })
  })
})
