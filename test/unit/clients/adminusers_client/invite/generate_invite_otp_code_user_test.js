'use strict'

// NPM dependencies
const Pact = require('pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Custom dependencies
const pactProxy = require('../../../../test_helpers/pact_proxy')
const PactInteractionBuilder = require('../../../../fixtures/pact_interaction_builder').PactInteractionBuilder
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers_client')
const inviteFixtures = require('../../../../fixtures/invite_fixtures')

// Constants
const INVITE_RESOURCE = '/v1/api/invites'
const mockPort = Math.floor(Math.random() * 65535)
const mockServer = pactProxy.create('localhost', mockPort)
const adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${mockPort}`})
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

describe('adminusers client - generate otp code for user invite', function () {
  let adminUsersMock

  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000)
    mockServer.start().then(function () {
      adminUsersMock = Pact({
        consumer: 'Selfservice-generate-user-invite-otp-code',
        provider: 'adminusers',
        port: mockPort
      })
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

  describe('generate user invite otp code', function () {
    context('generate user invite otp code - 200 OK', () => {
      const inviteCode = '7d19aff33f8948deb97ed16b2912dcd3'
      const validRegistrationRequest = inviteFixtures.validRegistrationRequest()

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${INVITE_RESOURCE}/${inviteCode}/otp/generate`)
            .withState('a valid invite exists with the given invite code')
            .withUponReceiving('a valid generate user invite otp code request')
            .withMethod('POST')
            .withRequestBody(validRegistrationRequest.getPactified())
            .withStatusCode(200)
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

      it('should generate user invite otp code successfully', function (done) {
        const registration = validRegistrationRequest.getPlain()
        adminusersClient.generateInviteOtpCode(inviteCode, registration.telephone_number, registration.password).should.be.fulfilled.notify(done)
      })
    })

    context('generate user invite otp code - 400 BAD REQUEST', () => {
      const inviteCode = '7d19aff33f8948deb97ed16b2912dcd3'
      const validRegistrationRequest = inviteFixtures.validRegistrationRequest()
      validRegistrationRequest.telephone_number = ''
      const errorResponse = inviteFixtures.badRequestResponseWhenFieldsMissing(['telephone_number'])

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${INVITE_RESOURCE}/${inviteCode}/otp/generate`)
            .withState('a valid invite exists with the given invite code')
            .withUponReceiving('invalid generate user invite otp code request')
            .withMethod('POST')
            .withRequestBody(validRegistrationRequest.getPactified())
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

      it('should 400 BAD REQUEST telephone number is not valid', function (done) {
        const registration = validRegistrationRequest.getPlain()
        adminusersClient.generateInviteOtpCode(inviteCode, registration.telephone_number, registration.password).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(400)
          expect(response.message.errors.length).to.equal(1)
          expect(response.message.errors[0]).to.equal('Field [telephone_number] is required')
        }).should.notify(done)
      })
    })

    context('complete user invite - 404 NOT FOUND', () => {
      const nonExistingInviteCode = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
      const validRegistrationRequest = inviteFixtures.validRegistrationRequest()

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${INVITE_RESOURCE}/${nonExistingInviteCode}/otp/generate`)
            .withState('invite not exists for the given invite code')
            .withUponReceiving('a valid generate user invite otp code of a non existing invite')
            .withMethod('POST')
            .withRequestBody(validRegistrationRequest.getPactified())
            .withStatusCode(404)
            .build()
        ).then(() => done())
      })

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      })

      it('should 404 NOT FOUND if user invite code not found', function (done) {
        const registration = validRegistrationRequest.getPlain()
        adminusersClient.generateInviteOtpCode(nonExistingInviteCode, registration.telephone_number, registration.password).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(404)
        }).should.notify(done)
      })
    })
  })
})
