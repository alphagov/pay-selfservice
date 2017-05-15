var Pact = require('pact');
var helpersPath = __dirname + '/../../test_helpers/';
var pactProxy = require(helpersPath + '/pact_proxy.js');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var getAdminUsersClient = require('../../../app/services/clients/adminusers_client');
var inviteFixtures = require(__dirname + '/../../fixtures/invite_fixtures');
var PactInteractionBuilder = require(__dirname + '/../../fixtures/pact_interaction_builder').PactInteractionBuilder;

chai.use(chaiAsPromised);

const expect = chai.expect;
const INVITE_RESOURCE = '/v1/api/invites';
var mockPort = Math.floor(Math.random() * 65535);
var mockServer = pactProxy.create('localhost', mockPort);

var adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${mockPort}`});

describe('adminusers client - submit registration detail', function () {

  let adminUsersMock;

  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000);
    mockServer.start().then(function () {
      adminUsersMock = Pact({consumer: 'Selfservice-register-user', provider: 'AdminUsers', port: mockPort});
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

  describe('submit registration details API', function () {

    context('submit registration details API - success', () => {
      let validRegistration = inviteFixtures.validRegistrationRequest();

      beforeEach((done) => {
        let pactified = validRegistration.getPactified();
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${INVITE_RESOURCE}/otp/generate`)
            .withUponReceiving('a registration details submission')
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

      it('should submit registration details successfully', function (done) {
        let registration = validRegistration.getPlain();
        adminusersClient.submitRegistration(registration.code, registration.telephone_number, registration.password).should.be.fulfilled
          .should.notify(done);
      });
    });

    context('submit registration details API - bad request', () => {
      let registrationDetails = inviteFixtures.validRegistrationRequest();
      registrationDetails.code = '';
      let errorResponse = inviteFixtures.badRequestResponseWhenFieldsMissing(['code']);

      beforeEach((done) => {
        let pactified = registrationDetails.getPactified();
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${INVITE_RESOURCE}/otp/generate`)
            .withUponReceiving('a registration details submission with missing code')
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
        let registration = registrationDetails.getPlain();
        adminusersClient.submitRegistration(registration.code, registration.telephone_number, registration.password).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(400);
          expect(response.message.errors.length).to.equal(1);
          expect(response.message.errors[0]).to.equal('Field [code] is required');
        }).should.notify(done);
      });
    });

    context('submit registration details API - invitation not found/expired', () => {
      let registrationData = inviteFixtures.validRegistrationRequest();

      beforeEach((done) => {
        let pactified = registrationData.getPactified();
        adminUsersMock.addInteraction(
          new PactInteractionBuilder(`${INVITE_RESOURCE}/otp/generate`)
            .withUponReceiving('a registration details submission for non existent code')
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
        let registration = registrationData.getPlain();
        adminusersClient.submitRegistration(registration.code, registration.telephone_number, registration.password).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(404);
        }).should.notify(done);
      });
    });
  });

  describe('submit resend otp code API', function () {

    context('submit resend otp code API - success', () => {
      let validOtpResend = inviteFixtures.validResendOtpCodeRequest();

      beforeEach((done) => {
        let pactified = validOtpResend.getPactified();
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
        );
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should submit otp code resend successfully', function (done) {
        let registration = validOtpResend.getPlain();

        adminusersClient.resendOtpCode(registration.code, registration.telephone_number).should.be.fulfilled
          .should.notify(done);
      });
    });

    context('submit resend otp code API - bad request', () => {
      let validOtpResend = inviteFixtures.validResendOtpCodeRequest();
      validOtpResend.code = '';
      let errorResponse = inviteFixtures.badRequestResponseWhenFieldsMissing(['code']);

      beforeEach((done) => {
        let pactified = validOtpResend.getPactified();
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
        );
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should return 400 on missing fields', function (done) {
        let resendData = validOtpResend.getPlain();
        adminusersClient.resendOtpCode(resendData.code, resendData.telephone_number).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(400);
          expect(response.message.errors.length).to.equal(1);
          expect(response.message.errors[0]).to.equal('Field [code] is required');
        }).should.notify(done);
      });
    });

    context('submit resend otp code API - invitation not found/expired', () => {
      let validOtpResend = inviteFixtures.validResendOtpCodeRequest();

      beforeEach((done) => {
        let pactified = validOtpResend.getPactified();
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
        );
      });

      afterEach((done) => {
        adminUsersMock.finalize().then(() => done())
      });

      it('should return 404 when code is not found', function (done) {
        let resendData = validOtpResend.getPlain();
        adminusersClient.resendOtpCode(resendData.code, resendData.telephone_number).should.be.rejected.then(function (response) {
          expect(response.errorCode).to.equal(404);
        }).should.notify(done);
      });
    });
  });
});
