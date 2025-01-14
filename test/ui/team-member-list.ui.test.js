const renderTemplate = require('@test/test-helpers/html-assertions').render

describe('The team members view', function () {
  it('should render all team members with links grouped by role', function () {
    const templateData = {
      team_members: {
        admin: [
          { email: 'username1', link: 'view-username1-link' },
          { email: 'username2', link: 'view-username2-my-profile-link', is_current: true }
        ],
        'view-only': [
          { email: 'username3', link: 'view-username3-link' },
          { email: 'username4', link: 'view-username4-link' },
          { email: 'username5', link: 'view-username5-link' }
        ],
        'view-and-refund': [
          { email: 'username6', link: 'view-username6-link' }
        ],
        'view-and-initiate-moto': [
          { email: 'username7', link: 'view-username7-link' }
        ],
        'view-refund-and-initiate-moto': [
          { email: 'username8', link: 'view-username8-link' }
        ]
      },
      permissions: {
        users_service_read: true
      }
    }

    const body = renderTemplate('team-members/team-members', templateData)

    body.should.containSelector('#admin-role-header').withExactText('Administrators (2)')
    body.should.containSelector('#view-only-role-header').withExactText('View only (3)')
    body.should.containSelector('#view-and-refund-role-header').withExactText('View and refund (1)')
    body.should.containSelector('#view-and-initiate-moto-role-header').withExactText('View and take telephone payments (1)')
    body.should.containSelector('#view-refund-and-initiate-moto-role-header').withExactText('View, refund and take telephone payments (1)')

    body.should.containSelector('#team-members-admin-list .govuk-table').havingNumberOfRows(2)
    body.should.containSelector('#team-members-admin-list .govuk-table').havingRowAt(1).withText('username1')
    body.should.containSelector('#team-members-admin-list .govuk-table').havingRowAt(1).withALinkTo('view-username1-link')
    body.should.containSelector('#team-members-admin-list .govuk-table').havingRowAt(2).withText('username2 (you)')
    body.should.containSelector('#team-members-admin-list .govuk-table').havingRowAt(2).withALinkTo('view-username2-my-profile-link')

    body.should.containSelector('#team-members-view-only-list .govuk-table').havingNumberOfRows(3)
    body.should.containSelector('#team-members-view-only-list .govuk-table').havingRowAt(1).withText('username3')
    body.should.containSelector('#team-members-view-only-list .govuk-table').havingRowAt(1).withALinkTo('view-username3-link')
    body.should.containSelector('#team-members-view-only-list .govuk-table').havingRowAt(2).withText('username4')
    body.should.containSelector('#team-members-view-only-list .govuk-table').havingRowAt(2).withALinkTo('view-username4-link')
    body.should.containSelector('#team-members-view-only-list .govuk-table').havingRowAt(3).withText('username5')
    body.should.containSelector('#team-members-view-only-list .govuk-table').havingRowAt(3).withALinkTo('view-username5-link')

    body.should.containSelector('#team-members-view-and-refund-list .govuk-table').havingNumberOfRows(1)
    body.should.containSelector('#team-members-view-and-refund-list .govuk-table').havingRowAt(1).withText('username6')
    body.should.containSelector('#team-members-view-and-refund-list .govuk-table').havingRowAt(1).withALinkTo('view-username6-link')

    body.should.containSelector('#team-members-view-and-initiate-moto-list .govuk-table').havingNumberOfRows(1)
    body.should.containSelector('#team-members-view-and-initiate-moto-list .govuk-table').havingRowAt(1).withText('username7')
    body.should.containSelector('#team-members-view-and-initiate-moto-list .govuk-table').havingRowAt(1).withALinkTo('view-username7-link')

    body.should.containSelector('#team-members-view-refund-and-initiate-moto-list .govuk-table').havingNumberOfRows(1)
    body.should.containSelector('#team-members-view-refund-and-initiate-moto-list .govuk-table').havingRowAt(1).withText('username8')
    body.should.containSelector('#team-members-view-refund-and-initiate-moto-list .govuk-table').havingRowAt(1).withALinkTo('view-username8-link')
  })

  it('should render all team members without links if user does not have read permissions', function () {
    const templateData = {
      team_members: {
        admin: [
          { username: 'username2', link: 'view-username2-my-profile-link', is_current: true }
        ],
        'view-only': [
          { username: 'username5', link: 'view-username5-link' }
        ],
        'view-and-refund': []
      }
    }

    const body = renderTemplate('team-members/team-members', templateData)

    body.should.containSelector('#team-members-view-only-list .govuk-table').havingRowAt(1).withNoLink()
  })

  it('should render invite a team member option when user has create permissions', function () {
    const templateData = {
      permissions: {
        users_service_read: true,
        users_service_create: true
      }
    }

    const body = renderTemplate('team-members/team-members', templateData)

    body.should.containSelector('#invite-team-member-link')
  })

  it('should not render invite a team member option when user has no create permissions', function () {
    const templateData = {
      permissions: {
        users_service_read: true,
        users_service_create: false
      }
    }

    const body = renderTemplate('team-members/team-members', templateData)

    body.should.not.containSelector('#invite-team-member-link')
  })

  it('should render all invited team members grouped by role', function () {
    const templateData = {
      number_invited_members: 7,
      invited_team_members: {
        admin: [
          { email: 'username1' },
          { email: 'username2' }
        ],
        'view-only': [
          { email: 'username3' }
        ],
        'view-and-refund': [
          { email: 'username6' },
          { email: 'username5' }
        ],
        'view-and-initiate-moto': [
          { email: 'username7' }
        ],
        'view-refund-and-initiate-moto': [
          { email: 'username8' }
        ]
      },
      permissions: {
        users_service_read: true
      }
    }

    const body = renderTemplate('team-members/team-members', templateData)

    body.should.containSelector('#invited-team-members-heading').withExactText('Invited (7)')
    body.should.containSelector('#invited-team-members-admin-role-header').withExactText('Administrators (2)')
    body.should.containSelector('#invited-team-members-view-only-role-header').withExactText('View only (1)')
    body.should.containSelector('#invited-team-members-view-and-refund-role-header').withExactText('View and refund (2)')
    body.should.containSelector('#invited-team-members-view-and-initiate-moto-role-header').withExactText('View and take telephone payments (1)')
    body.should.containSelector('#invited-team-members-view-refund-and-initiate-moto-role-header').withExactText('View, refund and take telephone payments (1)')

    body.should.containSelector('#invited-team-members-admin-list .govuk-table').havingNumberOfRows(2)
    body.should.containSelector('#invited-team-members-admin-list .govuk-table').havingRowAt(1).withText('username1')
    body.should.containSelector('#invited-team-members-admin-list .govuk-table').havingRowAt(2).withText('username2')

    body.should.containSelector('#invited-team-members-view-only-list .govuk-table').havingNumberOfRows(1)
    body.should.containSelector('#invited-team-members-view-only-list .govuk-table').havingRowAt(1).withText('username3')

    body.should.containSelector('#invited-team-members-view-and-refund-list .govuk-table').havingNumberOfRows(2)
    body.should.containSelector('#invited-team-members-view-and-refund-list .govuk-table').havingRowAt(1).withText('username6')
    body.should.containSelector('#invited-team-members-view-and-refund-list .govuk-table').havingRowAt(2).withText('username5')

    body.should.containSelector('#invited-team-members-view-and-initiate-moto-list .govuk-table').havingNumberOfRows(1)
    body.should.containSelector('#invited-team-members-view-and-initiate-moto-list .govuk-table').havingRowAt(1).withText('username7')

    body.should.containSelector('#invited-team-members-view-refund-and-initiate-moto-list .govuk-table').havingNumberOfRows(1)
    body.should.containSelector('#invited-team-members-view-refund-and-initiate-moto-list .govuk-table').havingRowAt(1).withText('username8')
  })

  it('should not render invited team members list if there are no invitations', function () {
    const templateData = {
      invited_team_members: {
        admin: [],
        'view-only': [],
        'view-and-refund': []
      }
    }

    const body = renderTemplate('team-members/team-members', templateData)
    body.should.not.containSelector('#invited-team-members-heading')
    body.should.not.containSelector('#invited-team-members-admin-role-header')
    body.should.not.containSelector('#invited-team-members-view-only-role-header')
    body.should.not.containSelector('#invited-team-members-view-and-refund-role-header')
    body.should.not.containSelector('#invited-team-members-view-and-initiate-moto-header')
    body.should.not.containSelector('#invited-team-members-view-refund-and-initiate-moto-header')

    body.should.not.containSelector('#invited-team-members-admin-list')
    body.should.not.containSelector('#invited-team-members-view-only-list')
    body.should.not.containSelector('#invited-team-members-view-and-refund-list')
    body.should.not.containSelector('#invited-team-members-view-and-initiate-moto-list')
    body.should.not.containSelector('#invited-team-members-view-refund-and-initiate-moto-list')
  })
})
