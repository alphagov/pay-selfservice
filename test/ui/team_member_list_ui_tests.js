const path = require('path')
const should = require('chai').should()   // eslint-disable-line
const renderTemplate = require(path.join(__dirname, '/../test_helpers/html_assertions.js')).render

describe('The team members view', function () {
  it('should render all team members with links grouped by role', function () {
    const templateData = {
      'number_active_members': 6,
      'number_admin_members': 2,
      'number_view-and-refund_members': 1,
      'number_view-only_members': 3,
      'team_members': {
        'admin': [
          {username: 'username1', link: 'view-username1-link'},
          {username: 'username2', link: 'view-username2-my-profile-link', is_current: true}
        ],
        'view-only': [
          {username: 'username3', link: 'view-username3-link'},
          {username: 'username4', link: 'view-username4-link'},
          {username: 'username5', link: 'view-username5-link'}
        ],
        'view-and-refund': [
          {username: 'username6', link: 'view-username6-link'}
        ]
      },
      permissions: {
        'users_service_read': true
      }
    }

    const body = renderTemplate('services/team_members', templateData)

    body.should.containSelector('h2#active-team-members-heading').withExactText('Active (6)')
    body.should.containSelector('h3#admin-role-header').withExactText('Administrators (2)')
    body.should.containSelector('h3#view-only-role-header').withExactText('View only (3)')
    body.should.containSelector('h3#view-and-refund-role-header').withExactText('View and refund (1)')

    body.should.containSelector('div#team-members-admin-list ul').havingNumberOfItems(2)
    body.should.containSelector('div#team-members-admin-list ul').havingItemAt(1).withText('username1')
    body.should.containSelector('div#team-members-admin-list ul').havingItemAt(1).withALinkTo('view-username1-link')
    body.should.containSelector('div#team-members-admin-list ul').havingItemAt(2).withText('username2 (you)')
    body.should.containSelector('div#team-members-admin-list ul').havingItemAt(2).withALinkTo('view-username2-my-profile-link')

    body.should.containSelector('div#team-members-view-only-list ul').havingNumberOfItems(3)
    body.should.containSelector('div#team-members-view-only-list ul').havingItemAt(1).withText('username3')
    body.should.containSelector('div#team-members-view-only-list ul').havingItemAt(1).withALinkTo('view-username3-link')
    body.should.containSelector('div#team-members-view-only-list ul').havingItemAt(2).withText('username4')
    body.should.containSelector('div#team-members-view-only-list ul').havingItemAt(2).withALinkTo('view-username4-link')
    body.should.containSelector('div#team-members-view-only-list ul').havingItemAt(3).withText('username5')
    body.should.containSelector('div#team-members-view-only-list ul').havingItemAt(3).withALinkTo('view-username5-link')

    body.should.containSelector('div#team-members-view-and-refund-list ul').havingNumberOfItems(1)
    body.should.containSelector('div#team-members-view-and-refund-list ul').havingItemAt(1).withText('username6')
    body.should.containSelector('div#team-members-view-and-refund-list ul').havingItemAt(1).withALinkTo('view-username6-link')
  })

  it('should render all team members without links if user does not have read permissions', function () {
    const templateData = {
      'number_active_members': 2,
      'number_admin_members': 1,
      'number_view-and-refund_members': 0,
      'number_view-only_members': 1,
      'team_members': {
        'admin': [
          {username: 'username2', link: 'view-username2-my-profile-link', is_current: true}
        ],
        'view-only': [
          {username: 'username5', link: 'view-username5-link'}
        ],
        'view-and-refund': []
      }
    }

    const body = renderTemplate('services/team_members', templateData)

    body.should.containSelector('div#team-members-view-only-list ul').havingItemAt(1).withNoLink()
  })

  it('should render number of users of a role as 0 if no users are grouped in that role', function () {
    const templateData = {
      'number_active_members': 2,
      'number_admin_members': 1,
      'number_view-and-refund_members': 1,
      'number_view-only_members': 0,
      'team_members': {
        'admin': [
          {username: 'username1'}
        ],
        'view-only': [],
        'view-and-refund': [
          {username: 'username2', is_current: true}
        ]
      }
    }

    const body = renderTemplate('services/team_members', templateData)

    body.should.containSelector('h3#view-only-role-header').withExactText('View only (0)')
    body.should.containSelector('div#team-members-view-only-list').havingNumberOfRows(0)
  })

  it('should render invite a team member option when user has create permissions', function () {
    const templateData = {
      permissions: {
        'users_service_read': true,
        'users_service_create': true
      }
    }

    let body = renderTemplate('services/team_members', templateData)

    body.should.containSelector('a#invite-team-member-link')
  })

  it('should not render invite a team member option when user has no create permissions', function () {
    const templateData = {
      permissions: {
        'users_service_read': true,
        'users_service_create': false
      }
    }

    const body = renderTemplate('services/team_members', templateData)

    body.should.not.containSelector('a#invite-team-member-link')
  })
})
