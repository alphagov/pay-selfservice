let should = require('chai').should();
let renderTemplate = require(__dirname + '/../test_helpers/html_assertions.js').render;
let paths = require(__dirname + '/../../app/paths.js');

describe('The service name view in normal mode', function () {

  it('should display the service name view with permission but no the change service name link', function () {

    let templateData = {
      "serviceName": "Service Name",
      "editMode": false,
      permissions: {
        service_name_read: true
      }
    };

    let body = renderTemplate('service_name', templateData);

    body.should.containSelector('h1.page-title').withExactText('GOV.UK Pay - Change service name');
    body.should.containNoSelectorWithText('a#service-name-change-link');
    body.should.containSelector('#service-name').withExactText('Service Name');

  });

  it('should not display the service name when user does not have permission', function () {

    let templateData = {
      "serviceName": "Service Name",
      "editMode": false,
      permissions: {
        service_name_read: false
      }
    };

    let body = renderTemplate('service_name', templateData);

    body.should.containNoSelectorWithText('#service-name', 'Service Name');
  });
});

describe('The service name view in edit mode with permission', function () {

  it('should display the service name view', function () {
    let templateData = {
      "serviceName": "Service Name",
      "editMode": true,
      permissions: {
        service_name_update: true
      }
    };

    let body = renderTemplate('service_name', templateData);

    body.should.containSelector('h1.page-title').withExactText('GOV.UK Pay - Change service name');

    body.should.containInputField('service-name-input', 'text')
      .withAttribute('value', 'Service Name')
      .withLabel('Enter new service name');

    body.should.containInputField('service-name-save-button', 'submit');

    body.should.containSelector('a#service-name-cancel-link')
      .withAttribute("href", paths.serviceName.index)
      .withText("Cancel");
  });

  it('should display the service name view with permission', function () {
    let templateData = {
      "serviceName": "Service Name",
      "editMode": true,
      permissions: {
        service_name_update: false
      }
    };

    let body = renderTemplate('service_name', templateData);

    body.should.not.containSelector('input#service-name-input');
  });
});
