var should = require('chai').should();
var renderTemplate = require(__dirname + '/test_helpers/html_assertions.js').render;
var paths = require(__dirname + '/../app/paths.js');

describe('The service name view in normal mode', function () {
  it('should display the service name view', function () {
    var templateData = {
      "serviceName": "Service Name",
      "editMode": false
    };

    var body = renderTemplate('service_name', templateData);

    body.should.containSelector('h1.page-title').withExactText('GOV.UK Pay - Change service name');

    body.should.containSelector('a#service-name-change-link')
      .withAttribute("class", "button")
      .withAttribute("href", paths.serviceName.edit)
      .withText("Change service name");

    body.should.containSelector('#service-name').withExactText('Service Name');
  });
});

describe('The service name view in edit mode', function () {
  it('should display the service name view', function () {
    var templateData = {
      "serviceName": "Service Name",
      "editMode": true
    };

    var body = renderTemplate('service_name', templateData);

    body.should.containSelector('h1.page-title').withExactText('GOV.UK Pay - Change service name');

    body.should.containInputField('service-name-input', 'text')
      .withAttribute('value', 'Service Name')
      .withLabel('Enter new service name');

    body.should.containInputField('service-name-save-button', 'submit');

    body.should.containSelector('a#service-name-cancel-link')
      .withAttribute("href", paths.serviceName.index)
      .withText("Cancel");
  });
});