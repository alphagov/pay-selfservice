import { Pact } from '@pact-foundation/pact'
import path from 'path'
import chai from 'chai'
import _ from 'lodash'
import Builder from '@test/test-helpers/pact/pact-interaction-builder'
import AdminUsersClient from '@services/clients/pay/AdminUsersClient.class'
import { pactify } from '@test/test-helpers/pact/pactify'
import { UserFixture } from '@test/fixtures/user/user.fixture'
import User from '@models/user/User.class'
import { AuthenticateRequestFixture } from '@test/fixtures/user/authenticate-request.fixture'
import { BadRequestResponse, UnauthorisedResponse } from '@test/fixtures/user/user-error-responses.fixture'
const { PactInteractionBuilder } = Builder

const expect = chai.expect
const USER_PATH = '/v1/api/users'
let adminUsersClient: AdminUsersClient

describe('adminusers client - authenticate', function () {
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
    adminUsersClient = adminUsersClient = new AdminUsersClient(`http://127.0.0.1:${opts.port}`)
  })
  after(() => provider.finalize())

  describe('authenticate user API - success', () => {
    const request = new AuthenticateRequestFixture({ email: 'existing-user@example.com' }).toRequest()
    const validUserResponse = new UserFixture({ email: 'existing-user@example.com' }).toUserData()

    before(async () => {
      await provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/authenticate`)
          .withState('a user exists')
          .withUponReceiving('a valid user authenticate request')
          .withMethod('POST')
          .withRequestBody(request)
          .withStatusCode(200)
          .withResponseBody(pactify(validUserResponse))
          .build()
      )
    })

    afterEach(() => provider.verify())

    it('should authenticate a user successfully', function (done) {
      adminUsersClient.users
        .authenticate(request.email, request.password)
        .should.be.fulfilled.then(function (user: User) {
          expect(user.email).to.be.equal(validUserResponse.email)
          expect(
            _.isEqual(
              user.serviceRoles[0].service.gatewayAccountIds,
              validUserResponse.service_roles[0].service.gateway_account_ids
            )
          ).to.be.equal(true)
          expect(user.telephoneNumber).to.be.equal(validUserResponse.telephone_number)
          expect(user.otpKey).to.be.equal(validUserResponse.otp_key)
          expect(user.serviceRoles[0].role.name).to.be.equal(validUserResponse.service_roles[0].role.name)
          expect(user.serviceRoles[0].role.permissions.length).to.be.equal(
            validUserResponse.service_roles[0].role.permissions.length
          )
        })
        .should.notify(done)
    })
  })

  describe('authenticate user API - unauthorized', () => {
    const request = new AuthenticateRequestFixture({ email: 'nonexisting@example.com' }).toRequest()

    // const unauthorizedResponse = UnauthorisedResponse

    before(async () => {
      await provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/authenticate`)
          .withState('a user not exists with a given username password')
          .withUponReceiving('a user authenticate request with no matching user')
          .withMethod('POST')
          .withRequestBody(request)
          .withStatusCode(401)
          .withResponseBody(pactify(UnauthorisedResponse))
          .build()
      )
    })

    afterEach(() => provider.verify())

    it('should fail authentication if invalid username / password', function (done) {
      adminUsersClient.users
        .authenticate(request.email, request.password)
        .should.be.rejected.then(function (err) {
          expect(err.errorCode).to.equal(401)
          expect(err.message).to.equal(UnauthorisedResponse.errors[0])
        })
        .should.notify(done)
    })
  })

  describe('authenticate user API - bad request', () => {
    const request = new AuthenticateRequestFixture({ email: '', password: '' }).toRequest()

    before(async () => {
      await provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/authenticate`)
          .withState('a user exists with a given username password')
          .withUponReceiving('a user authenticate request with malformed request')
          .withMethod('POST')
          .withRequestBody(request)
          .withStatusCode(400)
          .withResponseBody(pactify(BadRequestResponse))
          .build()
      )
    })

    afterEach(() => provider.verify())

    it('should error bad request if mandatory fields are missing', function (done) {
      adminUsersClient.users
        .authenticate(request.email, request.password)
        .should.be.rejected.then(function (err) {
          expect(err.errorCode).to.equal(400)
          expect(err.message).to.equal(BadRequestResponse.errors.join(', '))
        })
        .should.notify(done)
    })
  })
})
