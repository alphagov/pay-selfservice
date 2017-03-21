let should = require('chai').should();
let renderTemplate = require(__dirname + '/../test_helpers/html_assertions.js').render;

describe('The team members view', function () {

  it('should render all team members with links grouped by role', function () {

    let templateData = {
      'number_active_members': 6,
      'number_admin_members': 2,
      'number_view-and-refund_members': 1,
      'number_view-only_members': 3,
      'team_members': {
        'admin': [
          {username: 'username1', link:'view-username1-link'},
          {username: 'username2', link:'view-username2-my-profile-link', is_current: true}
        ],
        'view-only': [
          {username: 'username3', link:'view-username3-link'},
          {username: 'username4', link:'view-username4-link'},
          {username: 'username5', link:'view-username5-link'},
        ],
        'view-and-refund': [
          {username: 'username6', link:'view-username6-link'}
        ]
      }
    };

    let body = renderTemplate('services/team_members', templateData);

    body.should.containSelector('p#active-team-members-heading').withExactText('Active (6)');
    body.should.containSelector('th#admin-role-header').withExactText('Administrators (2)');
    body.should.containSelector('th#view-only-role-header').withExactText('View only (3)');
    body.should.containSelector('th#view-and-refund-role-header').withExactText('View and refund (1)');

    body.should.containSelector('table#team-members-admin-list').havingNumberOfRows(2);
    body.should.containSelector('table#team-members-admin-list').havingRowAt(1).withTableDataAt(1, 'username1');
    body.should.containSelector('table#team-members-admin-list').havingRowAt(1).withAttribute('data-link', 'view-username1-link');
    body.should.containSelector('table#team-members-admin-list').havingRowAt(2).withTableDataAt(1, 'username2 (you)');
    body.should.containSelector('table#team-members-admin-list').havingRowAt(2).withAttribute('data-link', 'view-username2-my-profile-link');

    body.should.containSelector('table#team-members-view-only-list').havingNumberOfRows(3);
    body.should.containSelector('table#team-members-view-only-list').havingRowAt(1).withTableDataAt(1, 'username3');
    body.should.containSelector('table#team-members-view-only-list').havingRowAt(1).withAttribute('data-link', 'view-username3-link');
    body.should.containSelector('table#team-members-view-only-list').havingRowAt(2).withTableDataAt(1, 'username4');
    body.should.containSelector('table#team-members-view-only-list').havingRowAt(2).withAttribute('data-link', 'view-username4-link');
    body.should.containSelector('table#team-members-view-only-list').havingRowAt(3).withTableDataAt(1, 'username5');
    body.should.containSelector('table#team-members-view-only-list').havingRowAt(3).withAttribute('data-link', 'view-username5-link');

    body.should.containSelector('table#team-members-view-and-refund-list').havingNumberOfRows(1);
    body.should.containSelector('table#team-members-view-and-refund-list').havingRowAt(1).withTableDataAt(1, 'username6');
    body.should.containSelector('table#team-members-view-and-refund-list').havingRowAt(1).withAttribute('data-link', 'view-username6-link');

  });

  it('should render number of users of a role as 0 if no users are grouped in that role', function () {

    //Ignoring links for this test

    let templateData = {
      'number_active_members': 2,
      'number_admin_members': 1,
      'number_view-and-refund_members': 1,
      'number_view-only_members': 0,
      'team_members': {
        'admin': [
          {username: 'username1'},
        ],
        'view-only': [],
        'view-and-refund': [
          {username: 'username2', is_current: true}
        ]
      }
    };

    let body = renderTemplate('services/team_members', templateData);

    body.should.containSelector('th#view-only-role-header').withExactText('View only (0)');
    body.should.containSelector('table#team-members-view-only-list').havingNumberOfRows(0);
  });
});
