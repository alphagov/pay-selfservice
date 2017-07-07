'use strict'

// NPM dependencies
const Pact = require('pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Custom dependencies
const pactProxy = require('../../test_helpers/pact_proxy')
const PactInteractionBuilder = require('../../fixtures/pact_interaction_builder').PactInteractionBuilder
const getAdminUsersClient = require('../../../app/services/clients/adminusers_client')
const inviteFixtures = require(__dirname + '/../../fixtures/invite_fixtures')

// Constants
const INVITE_RESOURCE = '/v1/api/invites'
const mockPort = Math.floor(Math.random() * 65535)
const mockServer = pactProxy.create('localhost', mockPort)
const adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${mockPort}`})
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

describe('submit resend otp code API', function () {

  let adminUsersMock

  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000)
    mockServer.start().then(function () {
      adminUsersMock = Pact({consumer: 'Selfservice-register-user', provider: 'AdminUsers', port: mockPort})
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

  context('submit resend otp code API - success', () => {
    const validOtpResend = inviteFixtures.validResendOtpCodeRequest()

    beforeEach((done) => {
      const pactified = validOtpResend.getPactified()
      adminUsersMock.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/otp/resend`)
          .withUponReceiving('a resend otp code submission')
          .withMethod('POST')
          .withRequestBody(pactified)
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

    it('should submit otp code resend successfully', function (done) {
      const registration = validOtpResend.getPlain()

      adminusersClient.resendOtpCode(registration.code, registration.telephone_number).should.be.fulfilled
        .should.notify(done)
    })
  })

  context('submit resend otp code API - bad request', () => {
    const validOtpResend = inviteFixtures.validResendOtpCodeRequest()
    validOtpResend.code = ''
    const errorResponse = inviteFixtures.badRequestResponseWhenFieldsMissing(['code'])

    beforeEach((done) => {
      const pactified = validOtpResend.getPactified()
      adminUsersMock.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/otp/resend`)
          .withUponReceiving('a resend otp code submission with missing code')
          .withMethod('POST')
          .withRequestBody(pactified)
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

    it('should return 400 on missing fields', function (done) {
      const resendData = validOtpResend.getPlain()
      adminusersClient.resendOtpCode(resendData.code, resendData.telephone_number).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(400)
        expect(response.message.errors.length).to.equal(1)
        expect(response.message.errors[0]).to.equal('Field [code] is required')
      }).should.notify(done)
    })
  })

  context('submit resend otp code API - invitation not found/expired', () => {
    const validOtpResend = inviteFixtures.validResendOtpCodeRequest()

    beforeEach((done) => {
      const pactified = validOtpResend.getPactified()
      adminUsersMock.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/otp/resend`)
          .withUponReceiving('a resend otp code submission of non existent code')
          .withMethod('POST')
          .withRequestBody(pactified)
          .withStatusCode(404)
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

    it('should return 404 when code is not found', function (done) {
      const resendData = validOtpResend.getPlain()
      adminusersClient.resendOtpCode(resendData.code, resendData.telephone_number).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(404)
      }).should.notify(done)
    })
  })
})
