let should = require('chai').should();
let renderTemplate = require(__dirname + '/../test_helpers/html_assertions.js').render;
let paths = require(__dirname + '/../../app/paths.js');

describe('The current service name on landing page', function () {


  it('should display the current service name with navigation enabled', function () {

    let templateData = {
      navigation: true,
      currentServiceName: "System Generated",
      currentGatewayAccount: {
        type: "test",
        full_type: "sandbox test"
      }
    };

    let body = renderTemplate('layout', templateData);

    //body.should.containSelector('#phase-banner'); //.withText('System Generated  sandbox test');

  });

  it('should not display the current service name with navigation disabled', function () {

    let templateData = {
      navigation: false,
      currentServiceName: "System Generated",
      serviceName: "Service Name",
      editMode: false,
      currentGatewayAccount: {
        type: "test",
        full_type: "sandbox test"
      },
      permissions: {
        service_name_edit: false
      }
    };

    let body = renderTemplate('services/index', templateData);

    body.should.containNoSelectorWithText('#service-name', 'sandbox test');
    body.should.containSelector('#current_service_name').withText('System Generated');

  });
});

describe('The current service name on my services page', function () {

  it('should not display edit link of the current service name on my services page', function () {

    let templateData = {
      navigation: false,
      serviceName: "Service Name",
      currentServiceName: "System Generated",
      editMode: false,
      permissions: {
        service_name_update: false
      }
    };

    let body = renderTemplate('services/index', templateData);

    body.should.containNoSelector('#update_service_name');
    body.should.containSelector('#current_service_name').withText('System Generated');
  });

  it('should display edit link of the current service name on my services page', function () {

    let templateData = {
      navigation: false,
      serviceName: "Service Name",
      currentServiceName: "System Generated",
      editMode: false,
      permissions: {
        service_name_update: true
      }
    };

    let body = renderTemplate('services/index', templateData);

    body.should.containSelector('#update_service_name');
    body.should.containSelector('#current_service_name').withText('System Generated');
  });
});
