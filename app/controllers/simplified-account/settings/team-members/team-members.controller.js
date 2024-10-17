const { response } = require('../../../../utils/response')

const _ = require('lodash')
const paths = require('../../../../paths')
const formatSimplifiedAccountPathsFor = require('../../../../utils/simplified-account/format/format-simplified-account-paths-for')
const { getServiceUsers, getInvitedUsers } = require('../../../../services/user.service')
const { mapServiceUsersByRoles, mapInvitedUsersByRoles } = require('../../../../utils/simplified-account/format/arrange-users-by-role')

/**
 * Team members list view
 */
async function get (req, res, next) {
  const externalServiceId = req.service.externalId
  const accountType = req.account.type
  try {
    const [serviceUsers, invitedUsers] = await Promise.all([
      getServiceUsers(externalServiceId),
      getInvitedUsers(externalServiceId)
    ])
    console.log(serviceUsers)
    console.log(invitedUsers)
    const teamMembers = mapServiceUsersByRoles(serviceUsers, externalServiceId, accountType, req.user)
    const invitedTeamMembers = mapInvitedUsersByRoles(invitedUsers)
    const inviteTeamMemberLink = formatSimplifiedAccountPathsFor(paths.service.teamMembers.invite, externalServiceId, accountType)

    console.log('team_members: ')
    console.log(teamMembers)

    console.log('invited_team_members: ')
    console.log(invitedTeamMembers)
    console.log(invitedUsers.length)

    response(req, res, 'simplified-account/settings/team-members/index', {
      team_members: teamMembers,
      inviteTeamMemberLink: inviteTeamMemberLink,
      invited_team_members: invitedTeamMembers,
      number_invited_members: invitedUsers.length
    })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  get
}
