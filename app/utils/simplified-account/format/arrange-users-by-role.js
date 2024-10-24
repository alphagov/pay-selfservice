const _ = require('lodash')
const paths = require('../../../paths')
const formatSimplifiedAccountPathsFor = require('../../../utils/simplified-account/format/format-simplified-account-paths-for')
const { roles } = require('../../roles')

function mapTeamMembersByRoles (users, externalServiceId, accountType, currentUser) {
  const teamMembersRoleMap = {}
  users.forEach((user) => {
    const userRole = _.get(user.getRoleForService(externalServiceId), 'name')
    const isCurrentUser = currentUser.externalId === user.externalId
    const teamMember = {
      email: user.email,
      externalId: user.externalId
    }
    if (isCurrentUser) {
      teamMember.isCurrent = true
      teamMember.link = paths.user.profile.index
    } else {
      teamMember.removeLink = formatSimplifiedAccountPathsFor(paths.service.teamMembers.delete, externalServiceId, accountType, user.externalId)
      teamMember.changePermissionLink = formatSimplifiedAccountPathsFor(paths.service.teamMembers.permissions, externalServiceId, accountType, user.externalId)
    }
    addMemberToMap(teamMember, userRole, teamMembersRoleMap)
  })
  return teamMembersRoleMap
}

function mapInvitedTeamMembersByRoles (invitedUsers) {
  const invitedTeamMembersRolesMap = {}
  invitedUsers.forEach((user) => {
    const invitedTeamMember = {
      email: user.email,
      expired: user.expired
    }
    addMemberToMap(invitedTeamMember, user.role, invitedTeamMembersRolesMap)
  })
  return invitedTeamMembersRolesMap
}

function addMemberToMap (member, role, memberMap) {
  if (memberMap[role]) {
    memberMap[role].push(member)
  } else if (roles[role]) {
    memberMap[role] = [member]
  }
}

module.exports = {
  mapTeamMembersByRoles,
  mapInvitedTeamMembersByRoles
}
