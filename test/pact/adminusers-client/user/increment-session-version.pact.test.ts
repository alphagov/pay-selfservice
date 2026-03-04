import { Pact } from '@pact-foundation/pact'
import path from 'path'
import chai from 'chai'
import Builder from '@test/test-helpers/pact/pact-interaction-builder'
import AdminUsersClient from '@services/clients/pay/AdminUsersClient.class'
import { pactify } from '@test/test-helpers/pact/pactify'
import { UserFixture } from '@test/fixtures/user/user.fixture'
import { IncrementSessionVersionFixture } from '@test/fixtures/user/increment-session-version-request.fixture'
const { PactInteractionBuilder } = Builder

const expect = chai.expect
const USER_PATH = '/v1/api/users'
let adminUsersClient: AdminUsersClient

describe('adminusers client - session', function () {
  const provider = new Pact({
    consumer: 'selfservice',
    provider: 'adminusers',
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge',
  })

  before(async () => {
    const opts = await provider.setup()
    adminUsersClient = new AdminUsersClient(`http://127.0.0.1:${opts.port}`)
  })
  after(() => provider.finalize())

  describe('increment session version  API - success', () => {
    const request = new IncrementSessionVersionFixture().toRequest()
    const existingExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
    const userResponse = new UserFixture({ externalId: existingExternalId, sessionVersion: 1 }).toUserData()

    before(async () => {
      await provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${existingExternalId}`)
          .withState('a user exists')
          .withUponReceiving('a valid increment session version update request')
          .withMethod('PATCH')
          .withRequestBody(request)
          .withResponseBody(pactify(userResponse))
          .build()
      )
    })

    afterEach(() => provider.verify())

    it('should increment session version successfully', function (done) {
      adminUsersClient.users.incrementSessionVersion(existingExternalId).should.be.fulfilled.notify(done)
    })
  })

  describe('increment session version API - user not found', () => {
    const nonExistentExternalId = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    const request = new IncrementSessionVersionFixture().toRequest()

    before(async () => {
      await provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${nonExistentExternalId}`)
          .withState('a user does not exist')
          .withUponReceiving('a valid increment session version request')
          .withMethod('PATCH')
          .withRequestBody(request)
          .withResponseHeaders({})
          .withStatusCode(404)
          .build()
      )
    })

    afterEach(() => provider.verify())

    it('should return not found if user not exist', function (done) {
      adminUsersClient.users
        .incrementSessionVersion(nonExistentExternalId)
        .should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(404)
        })
        .should.notify(done)
    })
  })
})
