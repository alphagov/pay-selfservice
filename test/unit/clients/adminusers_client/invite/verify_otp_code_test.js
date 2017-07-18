var Pact = require('pact')
var pactProxy = require('../../../../test_helpers/pact_proxy')
var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
var getAdminUsersClient = require('../../../../../app/services/clients/adminusers_client')
var registrationFixtures = require('../../../../fixtures/invite_fixtures')
var PactInteractionBuilder = require('../../../../fixtures/pact_interaction_builder').PactInteractionBuilder

chai.use(chaiAsPromised)

const expect = chai.expect
const INVITE_RESOURCE = '/v1/api/invites'
var mockPort = Math.floor(Math.random() * 65535)
var mockServer = pactProxy.create('localhost', mockPort)

var adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${mockPort}`})

describe('adminusers client - submit verification details', function () {

  let adminUsersMock

  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000)
    mockServer.start().then(function () {
      adminUsersMock = Pact({consumer: 'Selfservice-verify-security-code', provider: 'adminusers', port: mockPort})
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

  describe('verify otp code API', function () {

    context('verify otp code - success', () => {
      let validRequest = registrationFixtures.validVerifyOtpCodeRequest()

      beforeEach((done) => {
        let pactified = validRequest.getPactified()
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${INVITE_RESOURCE}/otp/validate`)
            .withUponReceiving('a valid otp code submission')
            .withMethod('POST')
            .withRequestBody(pactified)
            .withStatusCode(201)
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

      it('should verify otp code successfully', function (done) {
        let securityCode = validRequest.getPlain()
        adminusersClient.verifyOtpAndCreateUser(securityCode.code, securityCode.otp).should.be.fulfilled
          .should.notify(done)
      })
    })

    context('verify otp code API - bad request', () => {
      let verifyCodeRequest = registrationFixtures.validVerifyOtpCodeRequest()
      verifyCodeRequest.code = ''
      let errorResponse = registrationFixtures.badRequestResponseWhenFieldsMissing(['code'])

      beforeEach((done) => {
        let pactified = verifyCodeRequest.getPactified()
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${INVITE_RESOURCE}/otp/validate`)
            .withUponReceiving('a verify otp code request with missing code')
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
        let verifyCodeData = verifyCodeRequest.getPlain()
        adminusersClient.verifyOtpAndCreateUser(verifyCodeData.code, verifyCodeData.otp).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(400)
          expect(response.message.errors.length).to.equal(1)
          expect(response.message.errors[0]).to.equal('Field [code] is required')
        }).should.notify(done)
      })
    })

    context('verify otp code API - invitation not found', () => {
      let verifyCodeRequest = registrationFixtures.validVerifyOtpCodeRequest()

      beforeEach((done) => {
        let pactified = verifyCodeRequest.getPactified()
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${INVITE_RESOURCE}/otp/validate`)
            .withUponReceiving('a verify otp code request with non existent code')
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

      it('should return 404 if code cannot be found', function (done) {
        let request = verifyCodeRequest.getPlain()
        adminusersClient.verifyOtpAndCreateUser(request.code, request.otp).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(404)
        }).should.notify(done)
      })
    })

    context('submit registration details API - invitation locked', () => {
      let verifyCodeRequest = registrationFixtures.validVerifyOtpCodeRequest()

      beforeEach((done) => {
        let pactified = verifyCodeRequest.getPactified()
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${INVITE_RESOURCE}/otp/validate`)
            .withUponReceiving('a registration details submission for locked code')
            .withMethod('POST')
            .withRequestBody(pactified)
            .withStatusCode(410)
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

      it('return 410 if code locked', function (done) {
        let request = verifyCodeRequest.getPlain()
        adminusersClient.verifyOtpAndCreateUser(request.code, request.otp).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(410)
        }).should.notify(done)
      })
    })
  })

})
