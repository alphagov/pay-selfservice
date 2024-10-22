const { expect } = require('chai')
const { mapTeamMembersByRoles, mapInvitedTeamMembersByRoles } = require('./arrange-users-by-role')
const User = require('../../../models/User.class')
const userFixtures = require('../../../../test/fixtures/user.fixtures')
const paths = require('../../../paths')
const ACCOUNT_TYPE = 'test'
const SERVICE_ID = 'service-id-123abc'

describe('arrange-users-by-role', () => {
  it('should arrange existing team members by role', () => {
    const adminUser = new User(userFixtures.validUserResponse({ external_id: 'user-id-for-admin-user', service_roles: { service: { service: { external_id: SERVICE_ID } } } }))
    const viewOnlyUser = new User(userFixtures.validUserResponse(
      {
        external_id: 'user-id-for-view-only-user',
        service_roles:
            {
              service:
                {
                  service: { external_id: SERVICE_ID },
                  role: { name: 'view-only' }
                }
            }
      }))
    const users = [adminUser, viewOnlyUser]

    const teamMembersRoleMap = mapTeamMembersByRoles(users, SERVICE_ID, ACCOUNT_TYPE, adminUser)

    expect(teamMembersRoleMap).to.have.property('admin').to.have.length(1)
    expect(teamMembersRoleMap.admin[0]).to.have.property('externalId').to.equal('user-id-for-admin-user')
    expect(teamMembersRoleMap.admin[0]).to.have.property('isCurrent').to.equal(true)
    expect(teamMembersRoleMap.admin[0]).to.have.property('link').to.equal(paths.user.profile.index)
    expect(teamMembersRoleMap.admin[0]).to.not.have.property('removeLink')
    expect(teamMembersRoleMap.admin[0]).to.not.have.property('changePermission')

    expect(teamMembersRoleMap).to.have.property('view-only').to.have.length(1)
    expect(teamMembersRoleMap['view-only'][0]).to.have.property('externalId').to.equal('user-id-for-view-only-user')
    expect(teamMembersRoleMap['view-only'][0]).to.have.property('removeLink')
      .to.equal('/simplified/service/service-id-123abc/account/test/team-member/user-id-for-view-only-user/delete')
    expect(teamMembersRoleMap['view-only'][0]).to.have.property('changePermissionLink')
      .to.equal('/simplified/service/service-id-123abc/account/test/team-member/user-id-for-view-only-user/permissions')
    expect(teamMembersRoleMap['view-only'][0]).to.not.have.property('isCurrent')
    expect(teamMembersRoleMap['view-only'][0]).to.not.have.property('link')
  })

  it('should arrange invited team members by role', () => {
    const invitedAdminUser = { email: 'invited_admin_user@user.gov.uk', role: 'admin' }
    const invitedViewOnlyUser = { email: 'invited_view-only_user@user.gov.uk', role: 'view-only' }
    const invitedUsers = [invitedAdminUser, invitedViewOnlyUser]

    const invitedTeamMembersRoleMap = mapInvitedTeamMembersByRoles(invitedUsers, SERVICE_ID, ACCOUNT_TYPE)

    expect(invitedTeamMembersRoleMap).to.have.property('admin').to.have.length(1)
    expect(invitedTeamMembersRoleMap.admin[0]).to.have.property('email').to.equal('invited_admin_user@user.gov.uk')
    expect(invitedTeamMembersRoleMap).to.have.property('view-only').to.have.length(1)
    expect(invitedTeamMembersRoleMap['view-only'][0]).to.have.property('email').to.equal('invited_view-only_user@user.gov.uk')
  })
})
