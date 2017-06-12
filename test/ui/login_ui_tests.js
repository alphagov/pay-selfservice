let should = require('chai').should();
let renderTemplate = require(__dirname + '/../test_helpers/html_assertions.js').render;
let paths = require('../../app/paths.js');

describe('Login view', function () {

  it('should render send otp code form', function (done) {
    let templateData = {
    };

    let body = renderTemplate('login/otp-login', templateData);

    body.should.containSelector('h1').withExactText('Check your phone');

    body.should.containSelector('form#otp-login-form').withAttribute('action', paths.user.otpLogIn);
    body.should.containSelector('input#sms_code').withAttribute('value', '');

    body.should.containSelector('div#display-otp-login > p:nth-child(3) > a').withExactText('Not received a text message?');
    body.should.containSelector('div#display-otp-login > p:nth-child(3) > a').withAttribute('href', paths.user.otpSendAgain);

    body.should.containSelector('div#display-otp-login > p:nth-child(4) > a').withExactText('Cancel');
    body.should.containSelector('div#display-otp-login > p:nth-child(4) > a').withAttribute('href', paths.user.logOut);

    done();
  });

  it('should render send otp code form with error message', function (done) {
    let templateData = {
      flash: {
        error: 'Invalid code'
      }
    };

    let body = renderTemplate('login/otp-login', templateData);

    body.should.containSelector('h1').withExactText('Check your phone');

    body.should.containSelector('.error').withExactText('Invalid code');

    body.should.containSelector('form#otp-login-form').withAttribute('action', paths.user.otpLogIn);
    body.should.containSelector('input#sms_code').withAttribute('value', '');

    body.should.containSelector('div#display-otp-login > p:nth-child(3) > a').withExactText('Not received a text message?');
    body.should.containSelector('div#display-otp-login > p:nth-child(3) > a').withAttribute('href', paths.user.otpSendAgain);

    body.should.containSelector('div#display-otp-login > p:nth-child(4) > a').withExactText('Cancel');
    body.should.containSelector('div#display-otp-login > p:nth-child(4) > a').withAttribute('href', paths.user.logOut);

    done();
  });
});
