const { Pact } = require('@pact-foundation/pact')
const path = require('path')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
const userFixtures = require('../../../../fixtures/user.fixtures')
const PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder

chai.use(chaiAsPromised)

const expect = chai.expect
const USER_PATH = '/v1/api/users'
const port = Math.floor(Math.random() * 48127) + 1024
const adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })

describe('adminusers client - session', function () {
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

  describe('increment session version  API - success', () => {
    const request = userFixtures.validIncrementSessionVersionRequest()
    const existingExternalId = '7d19aff33f8948deb97ed16b2912dcd3'

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${existingExternalId}`)
          .withState('a user exists')
          .withUponReceiving('a valid increment session version update request')
          .withMethod('PATCH')
          .withRequestBody(request)
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should increment session version successfully', function (done) {
      adminusersClient.incrementSessionVersionForUser(existingExternalId).should.be.fulfilled.notify(done)
    })
  })

  describe('increment session version API - user not found', () => {
    const nonExistentExternalId = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    const request = userFixtures.validIncrementSessionVersionRequest()

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${nonExistentExternalId}`)
          .withState('a user does not exist')
          .withUponReceiving('a valid increment session version request')
          .withMethod('PATCH')
          .withRequestBody(request)
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
