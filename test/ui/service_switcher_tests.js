let should = require('chai').should();
let renderTemplate = require(__dirname + '/../test_helpers/html_assertions.js').render;
let paths = require(__dirname + '/../../app/paths.js');

describe('The account switcher link', function () {

  it('should display if user has more than one gateway account id', function () {

    let templateData = {
      multipleGatewayAccounts: true
    };

    let body = renderTemplate('staff_frontend_template', templateData);

    body.should.containSelector('#my-services').withExactText('My services');
  });

  it('should not display if user has one or fewer gateway accounts', function () {

    let templateData = {
      multipleGatewayAccounts: false
    };

    let body = renderTemplate('staff_frontend_template', templateData);

    body.should.containNoSelector('#my-services');
  });

  it('should display Manage Team Members link in switcher page when user has permission to create users', function () {

    let templateData = {
      permissions: {
        users_service_create: true
      }
    };

    let body = renderTemplate('services/index', templateData);

    body.should.containSelector('a#manage-team-members').withExactText('Manage team members');
  });

  it('should display View Team Members link in switcher page when user has no permission to create users', function () {

    let templateData = {};

    let body = renderTemplate('services/index', templateData);

    body.should.containSelector('a#view-team-members').withExactText('View team members');
  });
});
