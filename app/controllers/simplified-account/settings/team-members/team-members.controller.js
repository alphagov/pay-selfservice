const paths = require('../../../../paths')
const formatSimplifiedAccountPathsFor = require('../../../../utils/simplified-account/format/format-simplified-account-paths-for')
const { response } = require('../../../../utils/response')
const { getServiceUsers, getInvitedUsers, findByExternalId } = require('../../../../services/user.service')
const { mapTeamMembersByRoles, mapInvitedTeamMembersByRoles } = require('../../../../utils/simplified-account/format/arrange-users-by-role')
const { roles } = require('../../../../utils/roles')

async function get (req, res, next) {
  const externalServiceId = req.service.externalId
  const accountType = req.account.type
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

async function getRemoveUser (req, res, next) {
  const externalServiceId = req.service.externalId
  const accountType = req.account.type
  try {
    const { externalId, email } = await findByExternalId(req.params.externalUserId)
    response(req, res, 'simplified-account/settings/team-members/removeUser',
      {
        externalId,
        email,
        backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.teamMembers.index, externalServiceId, accountType)
  })}
  catch (err) {
    next(err)
  }

}

async function getChangePermission (req, res, next) {
  // TODO implement change permission page
}

module.exports = {
  get,
  getRemoveUser,
  getChangePermission
}
