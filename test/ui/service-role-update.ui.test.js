const path = require('path')
const renderTemplate = require(path.join(__dirname, '/../test-helpers/html-assertions.js')).render

describe('The service role update view', function () {
  it('should render the standard service role update view', function () {
    const templateData = {
      email: 'oscar.smith@example.com',
      admin: { id: 2, checked: '' },
      viewAndRefund: { id: 3, checked: '' },
      view: { id: 4, checked: 'checked' },
      viewAndInitiateMoto: { id: 5, checked: '' },
      viewRefundAndInitiateMoto: { id: 6, checked: '' },
      editPermissionsLink: 'some-link',
      serviceHasAgentInitiatedMotoEnabled: false
    }

    const body = renderTemplate('team-members/team-member-permissions', templateData)

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
    body.should.not.containSelector('#role-view-and-intiate-moto-input')
    body.should.not.containSelector('#role-view-refund-and-intiate-moto-input')
  })

  it('should render the agent-initiated-MOTO-enhanced service role update view', function () {
    const templateData = {
      email: 'oscar.smith@example.com',
      admin: { id: 2, checked: '' },
      viewAndRefund: { id: 3, checked: '' },
      view: { id: 4, checked: 'checked' },
      viewAndInitiateMoto: { id: 5, checked: '' },
      viewRefundAndInitiateMoto: { id: 6, checked: '' },
      editPermissionsLink: 'some-link',
      serviceHasAgentInitiatedMotoEnabled: true
    }

    const body = renderTemplate('team-members/team-member-permissions', templateData)

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
    body.should.containSelector('#role-view-and-initiate-moto-input')
      .withAttribute('type', 'radio')
      .withAttribute('value', '5')
      .withNoAttribute('checked')
    body.should.containSelector('#role-view-refund-and-initiate-moto-input')
      .withAttribute('type', 'radio')
      .withAttribute('value', '6')
      .withNoAttribute('checked')
  })
})
