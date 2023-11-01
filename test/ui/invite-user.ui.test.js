let path = require('path')
let renderTemplate = require(path.join(__dirname, '/../test-helpers/html-assertions.js')).render
let paths = require('../../app/paths.js')

const formatServicePathsFor = require('../../app/utils/format-service-paths-for')

describe('Invite a team member view', function () {
  it('should render the standard invite team member view', function () {
    const externalServiceId = 'some-external-id'
    const teamMemberIndexLink = formatServicePathsFor(paths.service.teamMembers.index, externalServiceId)
    const teamMemberInviteSubmitLink = formatServicePathsFor(paths.service.teamMembers.invite, externalServiceId)

    let templateData = {
      teamMemberIndexLink: teamMemberIndexLink,
      teamMemberInviteSubmitLink: teamMemberInviteSubmitLink,
      admin: { id: 2 },
      viewAndRefund: { id: 3 },
      view: { id: 4 },
      viewAndInitiateMoto: { id: 5 },
      viewRefundAndInitiateMoto: { id: 6 },
      serviceHasAgentInitiatedMotoEnabled: false
    }

    let body = renderTemplate('team-members/team-member-invite', templateData)

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
    body.should.not.containSelector('#role-input-4')
    body.should.not.containSelector('#role-input-5')
  })

  it('should render the agent-initiated-MOTO-enhanced invite team member view', function () {
    const externalServiceId = 'some-external-id'
    const teamMemberIndexLink = formatServicePathsFor(paths.service.teamMembers.index, externalServiceId)
    const teamMemberInviteSubmitLink = formatServicePathsFor(paths.service.teamMembers.invite, externalServiceId)

    let templateData = {
      teamMemberIndexLink: teamMemberIndexLink,
      teamMemberInviteSubmitLink: teamMemberInviteSubmitLink,
      admin: { id: 2 },
      viewAndRefund: { id: 3 },
      view: { id: 4 },
      viewAndInitiateMoto: { id: 5 },
      viewRefundAndInitiateMoto: { id: 6 },
      serviceHasAgentInitiatedMotoEnabled: true
    }

    let body = renderTemplate('team-members/team-member-invite', templateData)

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
    body.should.containSelector('#role-input-4')
      .withAttribute('type', 'radio')
      .withAttribute('value', '5')
      .withNoAttribute('checked')
    body.should.containSelector('#role-input-5')
      .withAttribute('type', 'radio')
      .withAttribute('value', '6')
      .withNoAttribute('checked')
  })
})
