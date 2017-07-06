const path = require('path')
const should = require('chai').should()  // eslint-disable-line
const renderTemplate = require(path.join(__dirname, '/../test_helpers/html_assertions.js')).render
const paths = require('../../app/paths.js')

describe('Invite a team member view', function () {
  it('should render invite team member view', function () {
    let templateData = {
      admin: {id: 2},
      viewAndRefund: {id: 3},
      view: {id: 4}
    }

    let body = renderTemplate('services/team_member_invite', templateData)

    body.should.containSelector('form#invite-member-form').withAttribute('action', paths.teamMembers.invite)
    body.should.containSelector('input#role-admin-input')
      .withAttribute('type', 'radio')
      .withAttribute('value', '2')
      .withNoAttribute('checked')
    body.should.containSelector('input#role-view-and-refund-input')
      .withAttribute('type', 'radio')
      .withAttribute('value', '3')
      .withNoAttribute('checked')
    body.should.containSelector('input#role-view-input')
      .withAttribute('type', 'radio')
      .withAttribute('value', '4')
      .withAttribute('checked')
  })
})
