var Pact = require('pact')
var path = require('path')
var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
var getAdminUsersClient = require('../../../../../app/services/clients/adminusers_client')
var serviceFixtures = require('../../../../fixtures/service_fixtures')
var PactInteractionBuilder = require('../../../../fixtures/pact_interaction_builder').PactInteractionBuilder

chai.use(chaiAsPromised)

const expect = chai.expect
const SERVICES_PATH = '/v1/api/services'
var port = Math.floor(Math.random() * 48127) + 1024
var adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${port}`})

describe('adminusers client - service users', function () {
  let serviceExternalId = '12345'
  let nonExistingServiceId = '500'
  let responseParams = {
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
  let getServiceUsersResponse = serviceFixtures.validServiceUsersResponse([responseParams])

  let provider = Pact({
    consumer: 'selfservice',
    provider: 'adminusers',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  after((done) => provider.finalize().then(done()))

  describe('success', () => {
    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICES_PATH}/${serviceExternalId}/users`)
          .withState('a service exists with the given id')
          .withUponReceiving('a valid get service users request')
          .withResponseBody(getServiceUsersResponse.getPactified())
          .withStatusCode(200)
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should return service users successfully', function (done) {
      adminusersClient.getServiceUsers(serviceExternalId).should.be.fulfilled.then(
        function (users) {
          let expectedResponse = getServiceUsersResponse.getPlain()
          expect(users[0].serviceRoles.length).to.be.equal(expectedResponse[0].service_roles.length)
          expect(users[0].hasService(serviceExternalId)).to.be.equal(true)
        }
      ).should.notify(done)
    })
  })

  describe('failure', () => {
    before((done) => {
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

    it('should return service not found', function (done) {
      adminusersClient.getServiceUsers(nonExistingServiceId).should.be.rejected.then(
        function (err) {
          expect(err.errorCode).to.equal(404)
        }
      ).should.notify(done)
    })
  })
})
