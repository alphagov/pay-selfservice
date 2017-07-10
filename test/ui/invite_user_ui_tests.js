let should = require('chai').should();
let renderTemplate = require(__dirname + '/../test_helpers/html_assertions.js').render;
let paths = require('../../app/paths.js');

const formattedPathFor = require('../../app/utils/replace_params_in_path');

describe('Invite a team member view', function () {

  it('should render invite team member view', function () {

    const externalServiceId = 'some-external-id';
    const teamMemberIndexLink = formattedPathFor(paths.teamMembers.index, externalServiceId);
    const teamMemberInviteSubmitLink = formattedPathFor(paths.teamMembers.invite, externalServiceId);

    let templateData = {
      teamMemberIndexLink: teamMemberIndexLink,
      teamMemberInviteSubmitLink: teamMemberInviteSubmitLink,
      admin: {id: 2},
      viewAndRefund: {id: 3},
      view: {id: 4},
    };

    let body = renderTemplate('services/team_member_invite', templateData);

    body.should.containSelector('a.link-back').withAttribute('href', teamMemberIndexLink);
    body.should.containSelector('form#invite-member-form').withAttribute('action', teamMemberInviteSubmitLink);
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
