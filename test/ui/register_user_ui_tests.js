let should = require('chai').should();
let renderTemplate = require(__dirname + '/../test_helpers/html_assertions.js').render;
let paths = require('../../app/paths.js');

describe('Register user view', function () {

  it('should render create an account form', function (done) {

    let templateData = {
      email: 'invitee@example.com'
    };

    let body = renderTemplate('registration/register', templateData);

    body.should.containSelector('form#submit-registration').withAttribute('action', paths.register.submitDetails);
    body.should.containSelector('p#email-display').withExactText('Your account will be created with this email: invitee@example.com');
    body.should.containSelector('input#mobile-number');
    body.should.containSelector('input#password');
    done();
  });

  it('should render create an account form with telephone number pre-populated', function (done) {

    let templateData = {
      email: 'invitee@example.com',
      telephone_number: '0328534765'
    };

    let body = renderTemplate('registration/register', templateData);

    body.should.containSelector('form#submit-registration').withAttribute('action', paths.register.submitDetails);
    body.should.containSelector('p#email-display').withExactText('Your account will be created with this email: invitee@example.com');
    body.should.containSelector('input#mobile-number')
      .withAttribute("value", "0328534765");
    done();

  });

});
