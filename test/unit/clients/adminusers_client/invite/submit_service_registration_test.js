'use strict'

// NPM dependencies

const Pact = require('pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Custom dependencies

const pactProxy = require('../../../../test_helpers/pact_proxy')
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers_client')
const registerFixtures = require('../../../../fixtures/self_register_fixtures')
const PactInteractionBuilder = require('../../../../fixtures/pact_interaction_builder').PactInteractionBuilder

// Globals

chai.use(chaiAsPromised)

const expect = chai.expect
const mockPort = Math.floor(Math.random() * 65535)
const mockServer = pactProxy.create('localhost', mockPort)
const adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${mockPort}`})

const INVITE_PATH = '/v1/api/invites'

describe('adminusers client - self register service', function () {

  let adminUsersMock

  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000)
    mockServer.start().then(function () {
      adminUsersMock = Pact({consumer: 'Selfservice-self-register-service', provider: 'adminusers', port: mockPort})
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

  describe('self register service API', function () {

    context('send service registration notification API - success', () => {
      const validRegistration = registerFixtures.validRegisterRequest()

      const pactified = validRegistration.getPactified()
      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${INVITE_PATH}/service`)
            .withUponReceiving('a valid self create service request')
            .withMethod('POST')
            .withRequestBody(pactified)
            .withStatusCode(201)
            .build()
        ).then(() => {
          done()
        }).catch(e => {
          console.log(e)
        })
      })

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      })

      it('should send a notification successfully', function (done) {
        const register = validRegistration.getPlain()

        adminusersClient.submitServiceRegistration(register.email, register.telephone_number, register.password).should.be.fulfilled.then(function (response) {
        }).should.notify(done)
      })
    })

    context('send service registration notification API - bad request, should return error', () => {
      const invalidInvite = registerFixtures.invalidEmailRegisterRequest()
      const errorResponse = registerFixtures.badRequestResponseWhenFieldsMissing(['email'])

      beforeEach((done) => {
        const pactified = invalidInvite.getPactified()

        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${INVITE_PATH}/service`)
            .withUponReceiving('an invalid service registration request for an empty email')
            .withMethod('POST')
            .withRequestBody(pactified)
            .withStatusCode(400)
            .withResponseBody(errorResponse.getPactified())
            .build()
        ).then(() => {
          done()
        }).catch(e => {
          console.log(e)
        })
      })

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      })

      it('should return bad request', function (done) {
        const register = invalidInvite.getPlain()

        adminusersClient.submitServiceRegistration(register.email, register.telephone_number, register.password).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(400)
          expect(response.message.errors.length).to.equal(1)
          expect(response.message.errors).to.deep.equal(errorResponse.getPlain().errors)
        }).should.notify(done)
      })
    })
  })
})
