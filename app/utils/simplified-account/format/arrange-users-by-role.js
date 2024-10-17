const { roles } = require('../../roles')
const _ = require('lodash')
const paths = require('../../../paths')
const formatSimplifiedAccountPathsFor = require('../../../utils/simplified-account/format/format-simplified-account-paths-for')

function mapServiceUsersByRoles (users, externalServiceId, accountType, currentUser) {
  const serviceUserRolesMap = getEmptyUserRolesMap()
  users.map((user) => {
    const userRoleName = _.get(user.getRoleForService(externalServiceId), 'name')
    if (roles[userRoleName]) {
      const isCurrentUser = currentUser.externalId === user.externalId
      const mappedUser = {
        email: user.email,
        external_id: user.externalId,
      }
      if (isCurrentUser) {
        mappedUser.is_current = true
        mappedUser.link = paths.user.profile.index
      }
      else {
        mappedUser.removeLink = formatSimplifiedAccountPathsFor(paths.service.teamMembers.delete, externalServiceId, accountType, user.externalId)
        mappedUser.changePermissionLink = formatSimplifiedAccountPathsFor(paths.service.teamMembers.permissions, externalServiceId, accountType, user.externalId)
      }
      serviceUserRolesMap[userRoleName].push(mappedUser)
    }
  })
  return serviceUserRolesMap
}

function mapInvitedUsersByRoles(invitedUsers) {
  const invitedUserRolesMap = getEmptyUserRolesMap()
  invitedUsers.map((user) => {
    if (roles[user.role]) {
      const mappedUser = {
        email: user.email,
        expired: user.expired
      }
      invitedUserRolesMap[user.role].push(mappedUser)
    }
  })
  return invitedUserRolesMap
}

function getEmptyUserRolesMap() {
  const userRolesMap = {}
  for (const role in roles) {
    userRolesMap[roles[role].name] = []
  }
  return userRolesMap
}

module.exports = {
  mapServiceUsersByRoles,
  mapInvitedUsersByRoles
}
