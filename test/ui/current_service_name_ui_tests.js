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

    let body = renderTemplate('staff_frontend_template', templateData);

    body.should.containSelector('.environment-tag.grid-row.test').withExactText('System Generated  sandbox test');

  });

  it('should not display the current service name with navigation disabled', function () {

    let templateData = {
      navigation: false,
      "serviceName": "Service Name",
      "editMode": false,
      permissions: {
        service_name_read: false
      }
    };

    let body = renderTemplate('service_name', templateData);
    console.log('>>>>', body);

    body.should.containNoSelectorWithText('#service-name', 'sandbox test');
  });

  // it('should display the current service name on my services page', function () {
  //
  //   let templateData = {
  //     navigation: false,
  //     "serviceName": "Service Name",
  //     "editMode": false,
  //     permissions: {
  //       service_name_read: false
  //     }
  //   };
  //
  //   let body = renderTemplate('service_name', templateData);
  //   console.log('>>>>', body);
  //
  //   body.should.containNoSelectorWithText('#service-name', 'sandbox test');
  // });
});
