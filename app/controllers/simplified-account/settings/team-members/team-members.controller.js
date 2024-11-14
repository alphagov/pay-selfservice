const paths = require('../../../../paths')
const formatSimplifiedAccountPathsFor = require('../../../../utils/simplified-account/format/format-simplified-account-paths-for')
const { response } = require('../../../../utils/response')
const { getServiceUsers, getInvitedUsers } = require('../../../../services/user.service')
const { mapTeamMembersByRoles, mapInvitedTeamMembersByRoles } = require('../../../../utils/simplified-account/format/arrange-users-by-role')
const { roles } = require('../../../../utils/roles')

async function get (req, res, next) {
  const externalServiceId = req.service.externalId
  const accountType = req.account.type
  const messages = res.locals?.flash?.messages ?? []
  try {
    const [serviceUsers, invitedUsers] = await Promise.all([
      getServiceUsers(externalServiceId),
      getInvitedUsers(externalServiceId)
    ])
    const teamMembers = mapTeamMembersByRoles(serviceUsers, externalServiceId, accountType, req.user)
    const invitedTeamMembers = mapInvitedTeamMembersByRoles(invitedUsers)
    const inviteTeamMemberLink = formatSimplifiedAccountPathsFor(paths.service.teamMembers.invite, externalServiceId, accountType)
    const numberInvitedMembers = invitedUsers.length
    const isServiceAdmin = req.user.isAdminUserForService(externalServiceId)

    response(req, res, 'simplified-account/settings/team-members/index', {
      messages,
      teamMembers,
      inviteTeamMemberLink,
      invitedTeamMembers,
      numberInvitedMembers,
      isServiceAdmin,
      roles
    })
  } catch (err) {
    next(err)
  }
}

async function getChangePermission (req, res, next) {
  // TODO implement change permission page
}

module.exports.get = get
module.exports.getChangePermission = getChangePermission
module.exports.removeUser = require('./remove-user/remove-user.controller')
module.exports.changePermission = require('./change-permission/change-permission.controller')
