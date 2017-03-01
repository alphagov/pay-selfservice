let should = require('chai').should();
let renderTemplate = require(__dirname + '/../test_helpers/html_assertions.js').render;
let paths = require(__dirname + '/../../app/paths.js');

describe('The service name view in normal mode', function () {

  it('should display account type after the service name', function () {

    let templateData = {
      "serviceName": "Service Name",
      "editMode": false,
      permissions: {
        service_name_read: true
      }
    };

    let body = renderTemplate('service_name', templateData);

    body.should.containSelector('#account-type-tag').withExactText('Live');
  });
});
