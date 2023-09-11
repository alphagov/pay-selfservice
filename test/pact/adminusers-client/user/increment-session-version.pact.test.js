const { Pact } = require('@pact-foundation/pact')
const path = require('path')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const getAdminUsersClient = require('../../../../app/services/clients/adminusers.client')
const userFixtures = require('../../../fixtures/user.fixtures')
const PactInteractionBuilder = require('../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder

chai.use(chaiAsPromised)

const expect = chai.expect
const USER_PATH = '/v1/api/users'
let adminUsersClient

describe('adminusers client - session', function () {
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
    adminUsersClient = getAdminUsersClient({ baseUrl: `http://127.0.0.1:${opts.port}` })
  })
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
      adminUsersClient.incrementSessionVersionForUser(existingExternalId).should.be.fulfilled.notify(done)
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
      adminUsersClient.incrementSessionVersionForUser(nonExistentExternalId).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(404)
      }).should.notify(done)
    })
  })
})
