let validation = require(__dirname + '/../../../app/utils/registration_validations');
let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

let mockRegisterAccountCookie;

describe('registration_validation module', function () {

  describe('validate registration inputs', function () {

    it('should find the provided details valid', function (done) {
      let validPhoneNumber = '01234567890';
      let validPassword = 'dnvlkHdPlfw8e_+@!';
      validation.validateRegistrationInputs(validPhoneNumber, validPassword)
        .should.be.fulfilled
        .notify(done);
    });

    it('should find the provided details valid for phone number with spaces', function (done) {
      let validPhoneNumber = '0123 4567 890';
      let validPassword = 'dnvlkHdPlfw8e_+@!';
      validation.validateRegistrationInputs(validPhoneNumber, validPassword)
        .should.be.fulfilled
        .notify(done);
    });

    it('should find the provided phone number invalid', function (done) {
      let validPhoneNumber = '(0)1234567890';
      let validPassword = 'dnvlkHdPlfw8e_+@!';
      validation.validateRegistrationInputs(validPhoneNumber, validPassword)
        .should.be.rejected.then((response) => {
        expect(response).to.equal('Invalid phone number');
      })
        .should.notify(done);
    });

    it('should invalidate if the provided password null/undefined', function (done) {
      let validPhoneNumber = '01234567890';
      let password = undefined;
      validation.validateRegistrationInputs(validPhoneNumber, password)
        .should.be.rejected.then((response) => {
        expect(response).to.equal('Your password is too simple. Choose a password that is harder for people to guess');
      })
        .should.notify(done);
    });

    it('should invalidate if the provided password a common password', function (done) {
      let validPhoneNumber = '01234567890';
      let password = '1234567890';
      validation.validateRegistrationInputs(validPhoneNumber, password)
        .should.be.rejected.then((response) => {
        expect(response).to.equal('Your password is too simple. Choose a password that is harder for people to guess');
      })
        .should.notify(done);
    });

    it('should invalidate if the provided password invalid if its too short', function (done) {
      let validPhoneNumber = '01234567890';
      let validPassword = '2se45&s';
      validation.validateRegistrationInputs(validPhoneNumber, validPassword)
        .should.be.rejected.then((response) => {
        expect(response).to.equal('Your password is too simple. Choose a password that is harder for people to guess');
      })
        .should.notify(done);
    });
  });

  describe('validate data needed to proceed with registration', function () {

    beforeEach((done) => {
      mockRegisterAccountCookie = {};
      done();
    });

    it('should success if both email and code are present', function (done) {
      mockRegisterAccountCookie.email = 'invitee@example.com';
      mockRegisterAccountCookie.code = 'nfjkh438rf3901jqf';

      validation.shouldProceedWithRegistration(mockRegisterAccountCookie)
        .should.be.fulfilled
        .notify(done);
    });

    it('should be rejected if cookie is undefined', function (done) {

      validation.shouldProceedWithRegistration(undefined)
        .should.be.rejected
        .notify(done);
    });

    it('should rejected if email is missing', function (done) {
      mockRegisterAccountCookie.code = 'nfjkh438rf3901jqf';

      validation.shouldProceedWithRegistration(mockRegisterAccountCookie)
        .should.be.rejected
        .notify(done);
    });

    it('should rejected if code is missing', function (done) {
      mockRegisterAccountCookie.email = 'invitee@example.com';

      validation.shouldProceedWithRegistration(mockRegisterAccountCookie)
        .should.be.rejected
        .notify(done);
    });
  });

  describe('validate telephone number input', function () {

    it('should find the provided details valid', function (done) {
      let validPhoneNumber = '01234567890';

      validation.validateRegistrationTelephoneNumber(validPhoneNumber)
        .should.be.fulfilled
        .notify(done);
    });

    it('should find the provided phone number invalid', function (done) {
      let validPhoneNumber = '(0)1234567890';

      validation.validateRegistrationTelephoneNumber(validPhoneNumber)
        .should.be.rejected.then((response) => {
        expect(response).to.equal('Invalid phone number');
      })
        .should.notify(done);
    });
  });

  describe('validate otp input', function () {

    it('should find otp valid', function (done) {
      let validOtp = '123456';

      validation.validateOtp(validOtp)
        .should.be.fulfilled
        .notify(done);
    });

    it('should error if otp is undefined', function (done) {
      let otp = undefined;

      validation.validateOtp(otp)
        .should.be.rejected.then((response) => {
        expect(response).to.equal('Invalid verification code');
      }).should.notify(done);
    });

    it('should error if otp is not a number', function (done) {
      let otp = 'werb37';

      validation.validateOtp(otp)
        .should.be.rejected.then((response) => {
        expect(response).to.equal('Invalid verification code');
      }).should.notify(done);
    });
  });
});
