let Pact = require('pact')
let path = require('path')
let chai = require('chai')
let chaiAsPromised = require('chai-as-promised')
let userFixtures = require('../../../../fixtures/user_fixtures')
let getAdminUsersClient = require('../../../../../app/services/clients/adminusers_client')
let PactInteractionBuilder = require('../../../../fixtures/pact_interaction_builder').PactInteractionBuilder
let port = Math.floor(Math.random() * 48127) + 1024
let adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${port}`})
chai.use(chaiAsPromised)
const expect = chai.expect
const USER_PATH = '/v1/api/users'

describe('adminusers client - get user', function () {
  let provider = Pact({
    consumer: 'selfservice-userapi',
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
    let existingExternalId = '7d19aff33f8948deb97ed16b2912dcd3'

    let params = {
      external_id: existingExternalId,
      gateway_account_ids: ['666', '7']
    }

    let getUserResponse = userFixtures.validUserResponse(params)

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${params.external_id}`)
          .withState('a user exists with the given external id')
          .withUponReceiving('a valid get user request')
          .withResponseBody(getUserResponse.getPactified())
          .build()
      ).then(done())
    })

    afterEach(() => provider.verify())

    it('should find a user successfully', function (done) {
      let expectedUserData = getUserResponse.getPlain()

      adminusersClient.getUserByExternalId(params.external_id).should.be.fulfilled.then(function (user) {
        expect(user.externalId).to.be.equal(expectedUserData.external_id)
        expect(user.username).to.be.equal(expectedUserData.username)
        expect(user.email).to.be.equal(expectedUserData.email)
        expect(user.serviceRoles.length).to.be.equal(1)
        expect(user.serviceRoles[0].service.gatewayAccountIds.length).to.be.equal(2)
        expect(user.telephoneNumber).to.be.equal(expectedUserData.telephone_number)
        expect(user.otpKey).to.be.equal(expectedUserData.otp_key)
        expect(user.serviceRoles[0].role.permissions.length).to.be.equal(expectedUserData.service_roles[0].role.permissions.length)
      }).should.notify(done)
    })
  })

  describe('not found', () => {
    let params = {
      external_id: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' // non existent external id
    }

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${USER_PATH}/${params.external_id}`)
          .withState('no user exists with the given external id')
          .withUponReceiving('a valid get user request of an non existing user')
          .withStatusCode(404)
          .withResponseHeaders({})
          .build()
      ).then(done())
    })

    afterEach(() => provider.verify())

    it('should respond 404 if user not found', function (done) {
      adminusersClient.getUserByExternalId(params.external_id).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(404)
      }).should.notify(done)
    })
  })
})
