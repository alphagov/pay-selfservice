let should = require('chai').should();
let renderTemplate = require(__dirname + '/../test_helpers/html_assertions.js').render;
let paths = require('../../app/paths.js');

describe('Self-create service view', function () {

  it('should render create an account form', function (done) {

    let templateData = {
    };

    let body = renderTemplate('self_create_service/register', templateData);

    body.should.containSelector('h1').withExactText('Create an account');

    body.should.containSelector('form#submit-service-creation').withAttribute('action', paths.selfCreateService.register);
    body.should.containInputField('email', 'text');
    body.should.containInputField('telephone-number', 'text');
    body.should.containInputField('password', 'password');

    done();
  });

  it('should render email sent page', function (done) {

    let email = 'bob@example.com';
    let templateData = {
      requester_email: email
    };

    let body = renderTemplate('self_create_service/confirm', templateData);

    body.should.containSelector('h1').withExactText('Check your email');
    body.should.containSelector('div#display-email-sent > p:nth-child(2)').withExactText(`An email has been sent to ${email}.`);
    body.should.containSelector('div#display-email-sent > p:nth-child(3)').withExactText('Click the link in the email to continue your registration.');

    done();
  });

  it('should render otp verify form', function (done) {

    let templateData = {
    };

    let body = renderTemplate('self_create_service/verify_otp', templateData);

    body.should.containSelector('h1').withExactText('Check your phone');

    body.should.containSelector('form#verify-phone-form > p:nth-child(3)').withExactText(`We've sent you a text message with a security code`);
    body.should.containSelector('form#verify-phone-form').withAttribute('action', paths.selfCreateService.otpVerify);
    body.should.containInputField('verify-code', 'text');

    body.should.containSelector('div#display_otp_verify > p:nth-child(2) > a').withExactText('Not received a text message?');

    done();
  });

  it('should render name your service form', function (done) {

    let templateData = {
    };

    let body = renderTemplate('self_create_service/set_name', templateData);

    body.should.containSelector('h1').withExactText('What service will you be taking payments for?');

    body.should.containInputField('service-name', 'text');
    body.should.containSelector('form#name-your-service-form').withAttribute('action', paths.selfCreateService.serviceNaming);

    done();
  });

  it('should render otp resend form', function (done) {

    let telephoneNumber = '07812345678';
    let templateData = {
      telephone_number: telephoneNumber
    };

    let body = renderTemplate('self_create_service/resend_otp', templateData);

    body.should.containSelector('h1').withExactText('Check your mobile number');

    body.should.containSelector('form#otp-resend-form').withAttribute('action', paths.selfCreateService.otpResend);
    body.should.containInputField('telephone-number', 'text').withAttribute("value", telephoneNumber);

    done();
  });
});