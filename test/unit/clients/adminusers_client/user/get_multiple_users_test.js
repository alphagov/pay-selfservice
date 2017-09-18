'use strict'

let Pact = require('pact')
let pactProxy = require('../../../../test_helpers/pact_proxy')
let chai = require('chai')
let chaiAsPromised = require('chai-as-promised')
let userFixtures = require('../../../../fixtures/user_fixtures')
let getAdminUsersClient = require('../../../../../app/services/clients/adminusers_client')
let PactInteractionBuilder = require('../../../../fixtures/pact_interaction_builder').PactInteractionBuilder
const random = require('../../../../../app/utils/random')

chai.use(chaiAsPromised)

const {expect} = chai
const USER_PATH = '/v1/api/users'
let mockPort = Math.floor(Math.random() * 65535)
let mockServer = pactProxy.create('localhost', mockPort)
let adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${mockPort}`})

describe('adminusers client - get user', function () {
  let adminUsersMock

  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000)
    mockServer.start().then(function () {
      adminUsersMock = Pact({consumer: 'Selfservice-get-user', provider: 'adminusers', port: mockPort})
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

  describe('GET multiple users api', () => {
    context('GET multiple users api - success', () => {
      let existingExternalIds = [
        random.randomUuid(),
        random.randomUuid()
      ]

      let params = existingExternalIds.map(existingExternalId => {
        return {
          external_id: existingExternalId,
          gateway_account_ids: ['666', '7']
        }
      })

      let getUserResponse = userFixtures.validMultipleUserResponse(params)

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(USER_PATH)
            .withQuery('ids', existingExternalIds.join())
            .withState('the given external id all refer to extant users')
            .withUponReceiving('a valid get user request')
            .withResponseBody(getUserResponse.getPactified())
            .build()
        ).then(() => done())
      })

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      })

      it('should find a user successfully', function () {
        let expectedUserData = getUserResponse.getPlain()

        let result = expect(adminusersClient.getUsersByExternalIds(existingExternalIds))

        return result.to.be.fulfilled.then(function (users) {
          users.forEach((user, index) => {
            expect(user.externalId).to.be.equal(expectedUserData[index].external_id)
            expect(user.username).to.be.equal(expectedUserData[index].username)
            expect(user.email).to.be.equal(expectedUserData[index].email)
            expect(user.serviceRoles.length).to.be.equal(1)
            expect(user.serviceRoles[0].service.gatewayAccountIds.length).to.be.equal(2)
            expect(user.telephoneNumber).to.be.equal(expectedUserData[index].telephone_number)
            expect(user.otpKey).to.be.equal(expectedUserData[index].otp_key)
            expect(user.serviceRoles[0].role.permissions.length).to.be.equal(expectedUserData[index].service_roles[0].role.permissions.length)
          })
        })
      })
    })

    context('GET user api - not found', () => {
      let existingExternalIds = [
        random.randomUuid(),
        random.randomUuid()
      ]

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(USER_PATH)
            .withQuery('ids', existingExternalIds.join())
            .withState('no user exits with the given external id')
            .withUponReceiving('a valid get user request of an non existing user')
            .withStatusCode(404)
            .withResponseHeaders({})
            .build()
        ).then(() => done())
      })

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      })

      it('should respond 404 if user not found', function () {
        return expect(adminusersClient.getUsersByExternalIds(existingExternalIds)).to.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(404)
        })
      })
    })
  })
})
