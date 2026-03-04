import { Pact } from '@pact-foundation/pact'
import path from 'path'
import chai from 'chai'
import Builder from '@test/test-helpers/pact/pact-interaction-builder'
import AdminUsersClient from '@services/clients/pay/AdminUsersClient.class'
import { pactify } from '@test/test-helpers/pact/pactify'
import { AuthenticateSecondFactorFixture } from '@test/fixtures/user/authenticate-second-factor.fixture'
import { UserFixture } from '@test/fixtures/user/user.fixture'
const { PactInteractionBuilder } = Builder

const expect = chai.expect
const USER_PATH = '/v1/api/users'
let adminUsersClient: AdminUsersClient

const existingExternalId = '7d19aff33f8948deb97ed16b2912dcd3'

describe('adminusers client', function () {
  const provider = new Pact({
    consumer: 'selfservice-to-be',
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

  describe('send new second factor API - success', () => {
    before(async () => {
      await provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${existingExternalId}/second-factor`)
          .withState('a user exists')
          .withUponReceiving('a valid second factor post request')
          .withMethod('POST')
          .build()
      )
    })

    afterEach(() => provider.verify())

    it('should send a new 2FA token successfully', function (done) {
      adminUsersClient.users.sendOTP(existingExternalId, false).should.be.fulfilled.notify(done)
    })
  })

  describe('send new 2FA token API - user not found', () => {
    const externalId = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' // non existent external id

    before(async () => {
      await provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${externalId}/second-factor`)
          .withUponReceiving('a second factor post request for a non-existent user')
          .withMethod('POST')
          .withStatusCode(404)
          .withResponseHeaders({})
          .build()
      )
    })

    afterEach(() => provider.verify())

    it('should return not found if user not exist', function (done) {
      adminUsersClient.users
        .sendOTP(externalId, false)
        .should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(404)
        })
        .should.notify(done)
    })
  })

  describe('authenticate a second factor API - success', () => {
    const token = '121212'
    const request = new AuthenticateSecondFactorFixture({ code: token }).toRequest()
    const response = new UserFixture({ externalId: existingExternalId }).toUserData()

    before(async () => {
      await provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${existingExternalId}/second-factor/authenticate`)
          .withState('a user exists')
          .withUponReceiving('a valid authenticate second factor token request')
          .withRequestBody(request)
          .withResponseBody(pactify(response))
          .withMethod('POST')
          .build()
      )
    })

    afterEach(() => provider.verify())

    it('authenticate a valid 2FA token successfully', function (done) {
      adminUsersClient.users
        .authenticateSecondFactor(existingExternalId, token)
        .should.be.fulfilled.then(function (createdUser) {
          expect(createdUser.externalId).to.be.equal(existingExternalId)
        })
        .should.notify(done)
    })
  })

  describe('authenticate second factor API - bad request', () => {
    const token = 'non-numeric-code'
    const request = new AuthenticateSecondFactorFixture({ code: token }).toRequest()

    before(async () => {
      await provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${existingExternalId}/second-factor/authenticate`)
          .withState('a user exists')
          .withUponReceiving('a invalid authenticate second factor token request')
          .withRequestBody(request)
          .withMethod('POST')
          .withStatusCode(400)
          .build()
      )
    })

    afterEach(() => provider.verify())

    it('error bad request an invalid 2FA token', function (done) {
      adminUsersClient.users
        .authenticateSecondFactor(existingExternalId, token)
        .should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(400)
        })
        .should.notify(done)
    })
  })

  describe('authenticate second factor API - unauthorized', () => {
    const token = '654321'
    const request = new AuthenticateSecondFactorFixture({ code: token }).toRequest()
    const existingExternalId = '7d19aff33f8948deb97ed16b2912dcd3'

    before(async () => {
      await provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${existingExternalId}/second-factor/authenticate`)
          .withState('a user exists')
          .withUponReceiving('an expired/unauthorized second factor token request')
          .withRequestBody(request)
          .withMethod('POST')
          .withStatusCode(401)
          .withResponseHeaders({})
          .build()
      )
    })

    afterEach(() => provider.verify())

    it('error unauthorized an expired/unauthorized 2FA token', function (done) {
      adminUsersClient.users
        .authenticateSecondFactor(existingExternalId, token)
        .should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(401)
        })
        .should.notify(done)
    })
  })
})
