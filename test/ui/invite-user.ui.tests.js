let path = require('path')
let renderTemplate = require(path.join(__dirname, '/../test-helpers/html-assertions.js')).render
let paths = require('../../app/paths.js')

const formattedPathFor = require('../../app/utils/replace-params-in-path')

describe('Invite a team member view', function () {
  it('should render invite team member view', function () {
    const externalServiceId = 'some-external-id'
    const teamMemberIndexLink = formattedPathFor(paths.teamMembers.index, externalServiceId)
    const teamMemberInviteSubmitLink = formattedPathFor(paths.teamMembers.invite, externalServiceId)

    let templateData = {
      teamMemberIndexLink: teamMemberIndexLink,
      teamMemberInviteSubmitLink: teamMemberInviteSubmitLink,
      admin: { id: 2 },
      viewAndRefund: { id: 3 },
      view: { id: 4 }
    }

    let body = renderTemplate('team-members/team_member_invite', templateData)

    body.should.containSelector('.govuk-back-link').withAttribute('href', teamMemberIndexLink)
    body.should.containSelector('form#invite-member-form').withAttribute('action', teamMemberInviteSubmitLink)
    body.should.containSelector('#role-input')
      .withAttribute('type', 'radio')
      .withAttribute('value', '2')
      .withNoAttribute('checked')
    body.should.containSelector('#role-input-2')
      .withAttribute('type', 'radio')
      .withAttribute('value', '3')
      .withNoAttribute('checked')
    body.should.containSelector('#role-input-3')
      .withAttribute('type', 'radio')
      .withAttribute('value', '4')
      .withAttribute('checked')
  })
})
