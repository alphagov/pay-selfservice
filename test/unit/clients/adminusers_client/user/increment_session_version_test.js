var Pact = require('pact')
var pactProxy = require('../../../../test_helpers/pact_proxy')
var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
var getAdminUsersClient = require('../../../../../app/services/clients/adminusers_client')
var userFixtures = require('../../../../fixtures/user_fixtures')
var PactInteractionBuilder = require('../../../../fixtures/pact_interaction_builder').PactInteractionBuilder

chai.use(chaiAsPromised)

const expect = chai.expect
const USER_PATH = '/v1/api/users'
var mockPort = Math.floor(Math.random() * 65535)
var mockServer = pactProxy.create('localhost', mockPort)

var adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${mockPort}`})

describe('adminusers client - session', function () {
  var adminUsersMock
  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000)
    mockServer.start().then(function () {
      adminUsersMock = Pact({consumer: 'selfservice', provider: 'adminusers', port: mockPort, pactfileWriteMode: 'merge'})
      done()
    })
  })

  /**
   * Remove the server and publish pacts to broker
   */
  after(function (done) {
    mockServer.delete()
      .then(() => pactProxy.removeAll())
      .then(() => done())
  })

  describe('increment session version API', function () {
    context('increment session version  API - success', () => {
      let request = userFixtures.validIncrementSessionVersionRequest()
      let existingExternalId = '7d19aff33f8948deb97ed16b2912dcd3'

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${USER_PATH}/${existingExternalId}`)
            .withState('a user exists')
            .withUponReceiving('a valid increment session version update request')
            .withMethod('PATCH')
            .withRequestBody(request.getPactified())
            .build()
        ).then(() => done())
      })

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      })

      it('should increment session version successfully', function (done) {
        adminusersClient.incrementSessionVersionForUser(existingExternalId).should.be.fulfilled.notify(done)
      })
    })

    context('increment session version API - user not found', () => {
      let nonExistentExternalId = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
      let request = userFixtures.validIncrementSessionVersionRequest()

      beforeEach((done) => {
        adminUsersMock.addInteraction(
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

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      })

      it('should return not found if user not exist', function (done) {
        adminusersClient.incrementSessionVersionForUser(nonExistentExternalId).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(404)
        }).should.notify(done)
      })
    })
  })
})
