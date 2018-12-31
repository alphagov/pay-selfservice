'use strict'

// NPM dependencies
const Pact = require('pact')
const path = require('path')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Local dependencies
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers_client')
const serviceFixtures = require('../../../../fixtures/service_fixtures')
const PactInteractionBuilder = require('../../../../fixtures/pact_interaction_builder').PactInteractionBuilder

// Global setup
chai.use(chaiAsPromised)

// Constants
const expect = chai.expect
const SERVICES_PATH = '/v1/api/services'
const port = Math.floor(Math.random() * 48127) + 1024
const adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${port}`})

describe('adminusers client - service users', () => {
  const serviceExternalId = '12345'
  const nonExistingServiceId = '500'
  const responseParams = {
    service_roles: [{
      service: {
        name: 'System Generated',
        external_id: serviceExternalId,
        gateway_account_ids: []
      },
      role: {
        name: 'admin',
        description: 'Administrator',
        permissions: ['perm-1', 'perm-2', 'perm-3'],
        '_links': [{
          'href': `http://adminusers.service/v1/api/users/${serviceExternalId}`,
          'rel': 'self',
          'method': 'GET'
        }]
      }
    }]
  }
  const getServiceUsersResponse = serviceFixtures.validServiceUsersResponse([responseParams])

  const provider = Pact({
    consumer: 'selfservice-to-be',
    provider: 'adminusers',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  after(done => provider.finalize().then(done()))

  describe('success', () => {
    before(done => {
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICES_PATH}/${serviceExternalId}/users`)
          .withState('a service exists with external id 12345')
          .withUponReceiving('a valid get service users request')
          .withResponseBody(getServiceUsersResponse.getPactified())
          .withStatusCode(200)
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should return service users successfully', done => {
      adminusersClient.getServiceUsers(serviceExternalId).should.be.fulfilled.then(
        users => {
          const expectedResponse = getServiceUsersResponse.getPlain()
          expect(users[0].serviceRoles.length).to.be.equal(expectedResponse[0].service_roles.length)
          expect(users[0].hasService(serviceExternalId)).to.be.equal(true)
        }
      ).should.notify(done)
    })
  })

  describe('failure', () => {
    before(done => {
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICES_PATH}/${nonExistingServiceId}/users`)
          .withState('a service doesnt exists with the given id')
          .withUponReceiving('a valid get service users request with non-existing service id')
          .withResponseBody(serviceFixtures.getServiceUsersNotFoundResponse().getPactified())
          .withStatusCode(404)
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
