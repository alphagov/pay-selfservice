let should = require('chai').should();
let renderTemplate = require(__dirname + '/../test_helpers/html_assertions.js').render;
let paths = require('../../app/paths.js');

describe('Register user view', function () {

  it('should render create an account form', function (done) {

    let templateData = {
      email: 'invitee@example.com'
    };

    let body = renderTemplate('registration/register', templateData);

    body.should.containSelector('form#submit-registration').withAttribute('action', paths.register.registration);
    body.should.containSelector('p#email-display').withExactText('Your account will be created with this email: invitee@example.com');
    body.should.containSelector('input#telephone-number');
    body.should.containSelector('input#password');
    done();
  });

  it('should render create an account form with telephone number pre-populated', function (done) {

    let templateData = {
      email: 'invitee@example.com',
      telephone_number: '0328534765'
    };

    let body = renderTemplate('registration/register', templateData);

    body.should.containSelector('form#submit-registration').withAttribute('action', paths.register.registration);
    body.should.containSelector('p#email-display').withExactText('Your account will be created with this email: invitee@example.com');
    body.should.containSelector('input#telephone-number')
      .withAttribute("value", "0328534765");
    done();

  });

  it('should render verify telephone number view', function (done) {

    let templateData = {
      email: 'invitee@example.com'
    };

    let body = renderTemplate('registration/verify_otp', templateData);

    body.should.containSelector('form#verify-phone-form').withAttribute('action', paths.register.otpVerify);
    body.should.containSelector('input#verify-code');
    done();
  });

  it('should render resend otp code view', function (done) {

    let telephoneNumber = '012345678901'

    let templateData = {
      telephone_number: telephoneNumber
    };

    let body = renderTemplate('registration/re_verify_phone', templateData);

    body.should.containSelector('form#otp-send-again').withAttribute('action', paths.register.reVerifyPhone);
    body.should.containSelector('input#telephone-number').withAttribute('value', telephoneNumber);
    done();
  });

});
