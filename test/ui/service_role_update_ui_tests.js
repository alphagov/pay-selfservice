let should = require('chai').should();
let renderTemplate = require(__dirname + '/../test_helpers/html_assertions.js').render;

describe('The service role update view', function () {

  it('should render service role update view', function () {

    let templateData = {
      email: 'oscar.smith@example.com',
      admin: {id: 2, checked: ''},
      viewAndRefund: {id: 3, checked: ''},
      view: {id: 4, checked: 'checked'}
    };

    let body = renderTemplate('services/service_roles', templateData);

    body.should.containSelector('span#email').withExactText('oscar.smith@example.com');
    body.should.containSelector('input#role-admin-input')
      .withAttribute('type', 'radio')
      .withAttribute('value', '2')
      .withNoAttribute('checked');
    body.should.containSelector('input#role-view-and-refund-input')
      .withAttribute('type', 'radio')
      .withAttribute('value', '3')
      .withNoAttribute('checked');
    body.should.containSelector('input#role-view-input')
      .withAttribute('type', 'radio')
      .withAttribute('value', '4')
      .withAttribute('checked');
  });

});
