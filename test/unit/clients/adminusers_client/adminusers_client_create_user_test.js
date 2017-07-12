'use strict'

// NPM dependencies
const Pact = require('pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const _ = require('lodash')

// Custom dependencies
const pactProxy = require('../../../test_helpers/pact_proxy')
const PactInteractionBuilder = require('../../../fixtures/pact_interaction_builder').PactInteractionBuilder
const getAdminUsersClient = require('../../../../app/services/clients/adminusers_client')
const userFixtures = require('../../../fixtures/user_fixtures')

// Constants
const USER_RESOURCE = '/v1/api/users'
const mockPort = Math.floor(Math.random() * 65535)
const mockServer = pactProxy.create('localhost', mockPort)
const adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${mockPort}`})

// Global setup
chai.use(chaiAsPromised)
const expect = chai.expect

describe('adminusers client - create a new user', function () {

  let adminUsersMock

  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000)
    mockServer.start().then(function () {
      adminUsersMock = Pact({consumer: 'Selfservice-create-new-service', provider: 'adminusers', port: mockPort})
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

  describe('creating a user', function () {

    context('create a user - success', () => {
      const validRequest = userFixtures.validCreateUserRequest()
      const validCreateUserResponse = userFixtures.validUserResponse(validRequest.getPlain())

      beforeEach((done) => {
        let pactified = validRequest.getPactified()
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${USER_RESOURCE}`)
            .withUponReceiving('a valid create user request')
            .withMethod('POST')
            .withRequestBody(pactified)
            .withStatusCode(201)
            .withResponseBody(validCreateUserResponse.getPactified())
            .build()
        ).then(() => {
          done()
        }).catch(e =>
          console.log(e)
        )
      })

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      })

      it('should create a new user', function (done) {
        let userData = validRequest.getPlain()
        adminusersClient.createUser(
          userData.email,
          userData.gateway_account_ids,
          userData.service_ids,
          userData.role_name,
          userData.telephone_number).should.be.fulfilled.then(user => {
          expect(user.username).to.be.equal(userData.username)
          expect(user.email).to.be.equal(userData.email)
          expect(user.serviceRoles[0].service.gatewayAccountIds).to.deep.equal(userData.gateway_account_ids)
          expect(user.telephoneNumber).to.be.equal(userData.telephone_number)
          expect(user.serviceRoles[0].role.name).to.be.equal(userData.role_name)
        }).should.notify(done)
      })
    })

    context('create a user - missing required fields', () => {
      const errorResponse = userFixtures.badRequestResponseWhenFieldsMissing(['username', 'email', 'gateway_account_ids', 'telephone_number', 'role_name'])

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${USER_RESOURCE}`)
            .withUponReceiving('a create user request missing required fields')
            .withMethod('POST')
            .withRequestBody({})
            .withStatusCode(400)
            .withResponseBody(errorResponse.getPactified())
            .build()
        ).then(() => {
          done()
        }).catch(e =>
          console.log(e)
        )
      })

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      })

      it('should return a 400', function (done) {
        adminusersClient.createUser().should.be.rejected.then(response => {
          expect(response.errorCode).to.equal(400)
          expect(response.message.errors.length).to.equal(5)
          expect(response.message.errors).to.deep.equal(errorResponse.getPlain().errors)
        }).should.notify(done)
      })
    })
  })
})
