'use strict'

const { Pact } = require('@pact-foundation/pact')
const path = require('path')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
const userFixtures = require('../../../../fixtures/user.fixtures')
const PactInteractionBuilder = require('../../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const { pactifyNestedArray } = require('../../../../test-helpers/pact/pactifier').defaultPactifier

// Global setup
chai.use(chaiAsPromised)

// Constants
const expect = chai.expect
const SERVICES_PATH = '/v1/api/services'
let adminUsersClient

const existingServiceExternalId = 'cp5wa'

describe('adminusers client - service users', () => {
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
    adminUsersClient = getAdminUsersClient({ baseUrl: `http://localhost:${opts.port}` })
  })
  after(() => provider.finalize())

  describe('single user is returned for service', () => {
    const getServiceUsersResponse = userFixtures.validUsersResponse([{
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
          .withResponseBody(pactifyNestedArray(getServiceUsersResponse))
          .withStatusCode(200)
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should return service users successfully', done => {
      adminUsersClient.getServiceUsers(existingServiceExternalId).should.be.fulfilled.then(
        users => {
          expect(users[0].serviceRoles.length).to.be.equal(getServiceUsersResponse[0].service_roles.length)
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
      adminUsersClient.getServiceUsers(nonExistingServiceId).should.be.rejected.then(
        err => {
          expect(err.errorCode).to.equal(404)
        }
      ).should.notify(done)
    })
  })
})
