'use strict'

// NPM dependencies
const Pact = require('pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Custom dependencies
const pactProxy = require('../../../../test_helpers/pact_proxy')
const PactInteractionBuilder = require('../../../../fixtures/pact_interaction_builder').PactInteractionBuilder
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers_client')

// Constants
const INVITE_RESOURCE = '/v1/api/invites'
const mockPort = Math.floor(Math.random() * 65535)
const mockServer = pactProxy.create('localhost', mockPort)
const adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${mockPort}`})
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

describe('adminusers client - generate otp code for service invite', function () {
  let adminUsersMock

  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000)
    mockServer.start().then(function () {
      adminUsersMock = Pact({
        consumer: 'selfservice',
        provider: 'adminusers',
        port: mockPort,
        pactfileWriteMode: 'merge'
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

  describe('generate service invite otp code', function () {
    context('generate service invite otp code - 200 OK', () => {
      const inviteCode = '7d19aff33f8948deb97ed16b2912dcd3'

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${INVITE_RESOURCE}/${inviteCode}/otp/generate`)
            .withState('a valid invite exists with the given invite code')
            .withUponReceiving('a valid generate service invite otp code request')
            .withMethod('POST')
            .withStatusCode(200)
            .build()
        )
          .then(() => done())
          .catch(done)
      })

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      })

      it('should generate service invite otp code successfully', function (done) {
        adminusersClient.generateInviteOtpCode(inviteCode).should.be.fulfilled.notify(done)
      })
    })

    context('complete service invite - 404 NOT FOUND', () => {
      const nonExistingInviteCode = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'

      beforeEach((done) => {
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${INVITE_RESOURCE}/${nonExistingInviteCode}/otp/generate`)
            .withState('invite not exists for the given invite code')
            .withUponReceiving('a valid generate service invite otp code of a non existing invite')
            .withMethod('POST')
            .withStatusCode(404)
            .build()
        ).then(() => done())
      })

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      })

      it('should 404 NOT FOUND if service invite code not found', function (done) {
        adminusersClient.generateInviteOtpCode(nonExistingInviteCode).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(404)
        }).should.notify(done)
      })
    })
  })
})
