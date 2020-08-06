let path = require('path')
let renderTemplate = require(path.join(__dirname, '/../test-helpers/html-assertions.js')).render

describe('The service role update view', function () {
  it('should render service role update view', function () {
    let templateData = {
      email: 'oscar.smith@example.com',
      admin: { id: 2, checked: '' },
      viewAndRefund: { id: 3, checked: '' },
      view: { id: 4, checked: 'checked' },
      editPermissionsLink: 'some-link'
    }

    let body = renderTemplate('team-members/team-member-permissions', templateData)

    body.should.containSelector('#email').withExactText('oscar.smith@example.com')
    body.should.containSelector('#role-update-form').withAttribute('action', 'some-link')
    body.should.containSelector('#role-admin-input')
      .withAttribute('type', 'radio')
      .withAttribute('value', '2')
      .withNoAttribute('checked')
    body.should.containSelector('#role-view-and-refund-input')
      .withAttribute('type', 'radio')
      .withAttribute('value', '3')
      .withNoAttribute('checked')
    body.should.containSelector('#role-view-input')
      .withAttribute('type', 'radio')
      .withAttribute('value', '4')
      .withAttribute('checked')
  })
})
