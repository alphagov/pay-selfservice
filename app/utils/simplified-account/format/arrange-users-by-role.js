const { roles } = require('../../roles')
const _ = require('lodash')
const paths = require('../../../paths')
const formatSimplifiedAccountPathsFor = require('../../../utils/simplified-account/format/format-simplified-account-paths-for')

function mapTeamMembersByRoles (users, externalServiceId, accountType, currentUser) {
  const teamMembersRoleMap = getEmptyUserRolesMap()
  users.map((user) => {
    const userRoleName = _.get(user.getRoleForService(externalServiceId), 'name')
    if (roles[userRoleName]) {
      const isCurrentUser = currentUser.externalId === user.externalId
      const teamMember = {
        email: user.email,
        external_id: user.externalId,
      }
      if (isCurrentUser) {
        teamMember.is_current = true
        teamMember.link = paths.user.profile.index
      }
      else {
        teamMember.removeLink = formatSimplifiedAccountPathsFor(paths.service.teamMembers.delete, externalServiceId, accountType, user.externalId)
        teamMember.changePermissionLink = formatSimplifiedAccountPathsFor(paths.service.teamMembers.permissions, externalServiceId, accountType, user.externalId)
      }
      teamMembersRoleMap[userRoleName]['members'].push(teamMember)
    }
  })
  return teamMembersRoleMap
}

function mapInvitedTeamMembersByRoles(invitedUsers) {
  const invitedTeamMembersRolesMap = getEmptyUserRolesMap()
  invitedUsers.map((user) => {
    if (roles[user.role]) {
      const invitedTeamMember = {
        email: user.email,
        expired: user.expired
      }
      invitedTeamMembersRolesMap[user.role]['members'].push(invitedTeamMember)
    }
  })
  return invitedTeamMembersRolesMap
}

function getEmptyUserRolesMap() {
  const userRolesMap = {}
  for (const role in roles) {
    userRolesMap[roles[role].name] = { description: roles[role].description, members: [] }
  }
  return userRolesMap
}

module.exports = {
  mapTeamMembersByRoles,
  mapInvitedTeamMembersByRoles
}
