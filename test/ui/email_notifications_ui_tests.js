var should = require('chai').should();
var renderTemplate = require(__dirname + '/../test_helpers/html_assertions.js').render;
var paths = require(__dirname + '/../../app/paths.js');

describe('The email body view', function () {

  it('should display the automatically generate email disclaimer', function () {
    var templateData = {
      'customEmailText': 'Custom text'
    };
    var body = renderTemplate('email_notifications/email_body', templateData);

    body.should.not.containSelector('span.grey.push-bottom.qa-custom-p');
    body.should.containSelector('p.push-bottom.qa-custom-p').withText('Custom text');
    body.should.containSelector('p').withText('This is an automatically generated email, please do not reply.');
  });

  it('should indicate custom text is optional by default', function () {

    var templateData = {
      'serviceName': 'service name'
    };

    var body = renderTemplate('email_notifications/email_body', templateData);

    body.should.containSelector('span.grey.push-bottom.qa-custom-p').withText('*Optional custom paragraph - add this below*');
  });
});
