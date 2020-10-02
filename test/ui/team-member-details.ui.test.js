let path = require('path')
let renderTemplate = require(path.join(__dirname, '/../test-helpers/html-assertions.js')).render

describe('The team member details view', () => {
  it('should render team member details', () => {
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

    let body = renderTemplate('team-members/team-member-details', templateData)

    expect(body).containSelector('h1#details-for').withOnlyText('Details for Oscar Smith')
    expect(body).containSelector('td#email').withExactText('oscar.smith@example.com')
    expect(body).containSelector('td#role').withExactText('View only')
    expect(body).containSelector('td#edit-permissions-link > a').withAttribute('href', 'some-link')
    expect(body).containSelector('#remove-team-member-confirm')
    expect(body).containSelector('form#remove-team-member-form').withAttribute('action', 'remove-link')
  })

  it(
    'should render team member details without remove team member link',
    () => {
      let templateData = {
        username: 'Oscar Smith',
        email: 'oscar.smith@example.com',
        role: 'View only',
        editPermissionsLink: 'some-link',
        removeTeamMemberLink: 'remove-link',
        permissions: {}
      }

      let body = renderTemplate('team-members/team-member-details', templateData)

      expect(body).containSelector('h1#details-for').withOnlyText('Details for Oscar Smith')
      expect(body).containSelector('td#email').withExactText('oscar.smith@example.com')
      expect(body).containSelector('td#role').withExactText('View only')
      expect(body).containSelector('td#edit-permissions-link > a').withAttribute('href', 'some-link')
      expect(body).containNoSelector('a#remove-team-member')
    }
  )

  it('should render team member My profile view', () => {
    let templateData = {
      username: 'John Smith',
      email: 'john.smith@example.com',
      telephone_number: '+447769897329',
      two_factor_auth: 'SMS'
    }

    let body = renderTemplate('team-members/team-member-profile', templateData)

    expect(body).containSelector('#email').withExactText('john.smith@example.com')
    expect(body).containSelector('#telephone-number').withText('+447769897329')
    expect(body).containSelector('#two-factor-auth').withText('Text message')
  })
})
