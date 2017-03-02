let should = require('chai').should();
let renderTemplate = require(__dirname + '/../test_helpers/html_assertions.js').render;
let paths = require(__dirname + '/../../app/paths.js');

describe('The account switcher link', function () {

  it('should display if user has more than one gateway account id', function () {

    let templateData = {
      multipleGatewayAccounts: true
    };

    let body = renderTemplate('staff_frontend_template', templateData);

    body.should.containSelector('#my-services').withExactText('My Services');
  });

  it('should not display if user has one or fewer gateway accounts', function () {

    let templateData = {
      multipleGatewayAccounts: false
    };

    let body = renderTemplate('staff_frontend_template', templateData);

    body.should.containNoSelector('#my-services');
  });
});