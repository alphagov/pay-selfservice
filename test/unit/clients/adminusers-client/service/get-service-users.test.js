'use strict'

// NPM dependencies
const { Pact } = require('@pact-foundation/pact')
const path = require('path')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Local dependencies
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
const userServiceFixtures = require('../../../../fixtures/user-service.fixture')
const PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder

// Global setup
chai.use(chaiAsPromised)

// Constants
const expect = chai.expect
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

  before(() => provider.setup())
  after(() => provider.finalize())

  describe('single user is returned for service', () => {
    const getServiceUsersResponse = userServiceFixtures.validServiceUsersResponse([{
      service_roles: [{
        service: {
          external_id: existingServiceExternalId
        }
      }]
    }])

    before(done => {
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

    it('should return service users successfully', done => {
      adminusersClient.getServiceUsers(existingServiceExternalId).should.be.fulfilled.then(
        users => {
          const expectedResponse = getServiceUsersResponse.getPlain()
          expect(users[0].serviceRoles.length).to.be.equal(expectedResponse[0].service_roles.length)
          expect(users[0].hasService(existingServiceExternalId)).to.be.equal(true)
        }
      ).should.notify(done)
    })
  })

  describe('service does not exist', () => {
    const nonExistingServiceId = '500'
    before(done => {
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICES_PATH}/${nonExistingServiceId}/users`)
          .withUponReceiving('a valid get service users request with non-existing service id')
          .withStatusCode(404)
          .withResponseHeaders({})
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should return service not found', done => {
      adminusersClient.getServiceUsers(nonExistingServiceId).should.be.rejected.then(
        err => {
          expect(err.errorCode).to.equal(404)
        }
      ).should.notify(done)
    })
  })
})
