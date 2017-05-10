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

    it('should find the provided phone number invalid', function (done) {
      let validPhoneNumber = '(0)1234567890';
      let validPassword = 'dnvlkHdPlfw8e_+@!';
      validation.validateRegistrationInputs(validPhoneNumber, validPassword)
        .should.be.rejected.then((response) => {
        expect(response).to.equal('Invalid phone number');
      })
        .should.notify(done);
    });

    it('should find the provided password invalid', function (done) {
      let validPhoneNumber = '01234567890';
      let validPassword = 'password';
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
});
