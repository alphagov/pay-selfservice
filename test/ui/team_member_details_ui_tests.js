let path = require('path')
let renderTemplate = require(path.join(__dirname, '/../test_helpers/html_assertions.js')).render

describe('The team member details view', function () {
  it('should render team member details', function () {
    let templateData = {
      username: 'Oscar Smith',
      email: 'oscar.smith@example.com',
      role: 'View only',
      editPermissionsLink: 'some-link',
      removeTeamMemberLink: 'remove-link',
      permissions: {
        users_service_delete: true
      }
    }

    let body = renderTemplate('services/team_member_details', templateData)

    body.should.containSelector('h1#details-for').withOnlyText('Details for Oscar Smith')
    body.should.containSelector('td#name').withExactText('Oscar Smith')
    body.should.containSelector('td#email').withExactText('oscar.smith@example.com')
    body.should.containSelector('td#role').withExactText('View only')
    body.should.containSelector('td#edit-permissions-link > a').withAttribute('href', 'some-link')
    body.should.containSelector('input#remove-team-member-confirm')
    body.should.containSelector('form#remove-team-member-form').withAttribute('action', 'remove-link')
  })

  it('should render team member details without remove team member link', function () {
    let templateData = {
      username: 'Oscar Smith',
      email: 'oscar.smith@example.com',
      role: 'View only',
      editPermissionsLink: 'some-link',
      removeTeamMemberLink: 'remove-link',
      permissions: {}
    }

    let body = renderTemplate('services/team_member_details', templateData)

    body.should.containSelector('h1#details-for').withOnlyText('Details for Oscar Smith')
    body.should.containSelector('td#name').withExactText('Oscar Smith')
    body.should.containSelector('td#email').withExactText('oscar.smith@example.com')
    body.should.containSelector('td#role').withExactText('View only')
    body.should.containSelector('td#edit-permissions-link > a').withAttribute('href', 'some-link')
    body.should.containNoSelector('a#remove-team-member')
  })

  it('should render team member My profile view', function () {
    let templateData = {
      username: 'John Smith',
      email: 'john.smith@example.com',
      telephone_number: '+447769897329'
    }

    let body = renderTemplate('services/team_member_profile', templateData)

    body.should.containSelector('td#name').withExactText('John Smith')
    body.should.containSelector('td#email').withExactText('john.smith@example.com')
    body.should.containSelector('td#telephone-number').withExactText('+447769897329')
  })
})
