var should = require('chai').should();
var renderTemplate = require(__dirname + '/utils/html_assertions.js').render;

describe('The credentials view', function () {

  it('should display credentials view for a worldpay account', function () {

    var templateData = {
      "payment_provider": "Worldpay",
      "gateway_account": "1",
      "credentials": {
        'username': 'a-username',
        'password': '****',
        'merchant_id': 'a-merchant-id'
      }
    };

    var body = renderTemplate('provider_credentials_views/worldpay', templateData);

    body.should.containSelector('div#account-id').withAttribute("class", "hidden").withText(1);
    body.should.containSelector('h2#view-title').withExactText('Your Worldpay Credentials');

    body.should.containSelector('div#credentials');
    body.should.containSelector('div#merchant-id').withExactText('a-merchant-id').withLabel('merchant-id-lbl', 'Merchant ID');
    body.should.containSelector('div#username').withExactText('a-username').withLabel('username-lbl', 'Username');
    body.should.containSelector('div#password').withExactText('****').withLabel('password-lbl', 'Password');
  });

  it('should display credentials view for a smartpay account', function () {

    var templateData = {
      "payment_provider": "Smartpay",
      "gateway_account": "1",
      "credentials": {
        'username': 'a-username',
        'password': '****'
      }
    };

    var body = renderTemplate('provider_credentials_views/smartpay', templateData);

    body.should.containSelector('div#account-id').withAttribute("class", "hidden").withText(1);
    body.should.containSelector('h2#view-title').withExactText('Your Smartpay Credentials');

    body.should.containSelector('div#credentials');
    body.should.not.containSelector('div#merchant-id');
    body.should.containSelector('div#username').withExactText('a-username').withLabel('username-lbl', 'Username');
    body.should.containSelector('div#password').withExactText('****').withLabel('password-lbl', 'Password');
  });

  it('should display credentials view for a sandbox account', function () {

    var templateData = {
      "payment_provider": "Sandbox",
      "gateway_account": "1",
      "credentials": {}
    };

    var body = renderTemplate('provider_credentials_views/sandbox', templateData);

    body.should.containSelector('h2#view-title').withExactText('Your Sandbox Credentials');
    body.should.containSelector('div#message').withExactText('This is a sandbox account');

    body.should.containSelector('div#credentials');
    body.should.not.containSelector('div#merchant-id');
    body.should.not.containSelector('div#username');
    body.should.not.containSelector('div#password');
  });
});
