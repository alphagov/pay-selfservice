const { Pact } = require('@pact-foundation/pact')
var path = require('path')
var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
var getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
var userFixtures = require('../../../../fixtures/user.fixtures')
var PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder

chai.use(chaiAsPromised)

const expect = chai.expect
const USER_PATH = '/v1/api/users'
var port = Math.floor(Math.random() * 48127) + 1024
var adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })

describe('adminusers client - session', function () {
  let provider = new Pact({
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

  describe('increment session version  API - success', () => {
    let request = userFixtures.validIncrementSessionVersionRequest()
    let existingExternalId = '7d19aff33f8948deb97ed16b2912dcd3'

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${existingExternalId}`)
          .withState('a user exists')
          .withUponReceiving('a valid increment session version update request')
          .withMethod('PATCH')
          .withRequestBody(request.getPactified())
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should increment session version successfully', function (done) {
      adminusersClient.incrementSessionVersionForUser(existingExternalId).should.be.fulfilled.notify(done)
    })
  })

  describe('increment session version API - user not found', () => {
    let nonExistentExternalId = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    let request = userFixtures.validIncrementSessionVersionRequest()

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${nonExistentExternalId}`)
          .withState('a user does not exist')
          .withUponReceiving('a valid increment session version request')
          .withMethod('PATCH')
          .withRequestBody(request.getPactified())
          .withResponseHeaders({})
          .withStatusCode(404)
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should return not found if user not exist', function (done) {
      adminusersClient.incrementSessionVersionForUser(nonExistentExternalId).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(404)
      }).should.notify(done)
    })
  })
})
