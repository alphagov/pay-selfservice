let should = require('chai').should();
let renderTemplate = require(__dirname + '/../test_helpers/html_assertions.js').render;
let paths = require('../../app/paths.js');

describe('Invite a team member view', function () {

  it('should render conflict view, if email already known to GOV.UK Pay', function () {
    let existinguser = 'balh@blah.com';
    let templateData = {
      invitee: existinguser
    };

    let body = renderTemplate('services/team_member_invite_conflict', templateData);

    body.should.containSelector('#conflict-message').withText(existinguser);
  });

});
