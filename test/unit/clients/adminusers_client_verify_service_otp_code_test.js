const Pact = require('pact');
const helpersPath = __dirname + '/../../test_helpers/';
const pactProxy = require(helpersPath + '/pact_proxy.js');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const getAdminUsersClient = require('../../../app/services/clients/adminusers_client');
const registrationFixtures = require(__dirname + '/../../fixtures/invite_fixtures');
const PactInteractionBuilder = require(__dirname + '/../../fixtures/pact_interaction_builder').PactInteractionBuilder;

chai.use(chaiAsPromised);

const expect = chai.expect;
const OTP_VALIDATE_RESOURCE = '/v1/api/invites/otp/validate/service';
const mockPort = Math.floor(Math.random() * 65535);
const mockServer = pactProxy.create('localhost', mockPort);

const adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${mockPort}`});

describe('adminusers client - validate otp code for a service', function () {

  let adminUsersMock;

  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000);
    mockServer.start().then(function () {
      adminUsersMock = Pact({consumer: 'Selfservice-verify-service-otp-code', provider: 'AdminUsers', port: mockPort});
      done();
    });
  });

  /**
   * Remove the server and publish pacts to broker
   */
  after(function (done) {
    mockServer.delete()
      .then(() => pactProxy.removeAll())
      .then(() => done());
  });

  describe('verify service otp code API', function () {

    context('verify service otp code - success', () => {
      let validRequest = registrationFixtures.validVerifyOtpCodeRequest({code: 'aValidCode'});

      beforeEach((done) => {
        let pactified = validRequest.getPactified();
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${OTP_VALIDATE_RESOURCE}`)
            .withState('a service invite exists with the given code')
            .withUponReceiving('a valid service otp code submission')
            .withMethod('POST')
            .withRequestBody(pactified)
            .withStatusCode(200)
            .build()
        ).then(() => {
          done()
        }).catch(e =>
          console.log(e)
        );
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should verify service otp code successfully', function (done) {
        let securityCode = validRequest.getPlain();
        adminusersClient.verifyOtpForServiceInvite(securityCode.code, securityCode.otp).should.be.fulfilled
          .should.notify(done);
      });
    });

    context('verify otp code API - bad request', () => {
      let verifyCodeRequest = registrationFixtures.validVerifyOtpCodeRequest();
      verifyCodeRequest.code = '';
      let errorResponse = registrationFixtures.badRequestResponseWhenFieldsMissing(['code']);

      beforeEach((done) => {
        let pactified = verifyCodeRequest.getPactified();
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${OTP_VALIDATE_RESOURCE}`)
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
        );
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should return 400 on missing fields', function (done) {
        let verifyCodeData = verifyCodeRequest.getPlain();
        adminusersClient.verifyOtpForServiceInvite(verifyCodeData.code, verifyCodeData.otp).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(400);
          expect(response.message.errors.length).to.equal(1);
          expect(response.message.errors[0]).to.equal('Field [code] is required');
        }).should.notify(done);
      });
    });

    context('verify otp code API - invitation not found', () => {
      let verifyCodeRequest = registrationFixtures.validVerifyOtpCodeRequest();

      beforeEach((done) => {
        let pactified = verifyCodeRequest.getPactified();
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${OTP_VALIDATE_RESOURCE}`)
            .withUponReceiving('a verify otp code request with non existent code')
            .withMethod('POST')
            .withRequestBody(pactified)
            .withStatusCode(404)
            .build()
        ).then(() => {
          done()
        }).catch(e =>
          console.log(e)
        );
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should return 404 if code cannot be found', function (done) {
        let request = verifyCodeRequest.getPlain();
        adminusersClient.verifyOtpForServiceInvite(request.code, request.otp).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(404);
        }).should.notify(done);
      });
    });

    context('submit registration details API - invitation locked', () => {
      let verifyCodeRequest = registrationFixtures.validVerifyOtpCodeRequest();

      beforeEach((done) => {
        let pactified = verifyCodeRequest.getPactified();
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${OTP_VALIDATE_RESOURCE}`)
            .withUponReceiving('a registration details submission for locked code')
            .withMethod('POST')
            .withRequestBody(pactified)
            .withStatusCode(410)
            .build()
        ).then(() => {
          done()
        }).catch(e =>
          console.log(e)
        );
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('return 410 if code locked', function (done) {
        let request = verifyCodeRequest.getPlain();
        adminusersClient.verifyOtpForServiceInvite(request.code, request.otp).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(410);
        }).should.notify(done);
      });
    });
  });
});
