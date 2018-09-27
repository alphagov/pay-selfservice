'use strict'

// NPM dependencies
const logger = require('winston')

// local dependencies
const {response, renderErrorView} = require('../../utils/response')
const userService = require('../../services/user_service')
const formattedPathFor = require('../../utils/replace_params_in_path')
const {roles, mapByRoles, mapInvitesByRoles} = require('../../utils/roles')
const paths = require('../../paths')

module.exports = (req, res) => {
  const externalServiceId = req.params.externalServiceId
  const onSuccess = function ([members, invitedMembers]) {
    const teamMembers = mapByRoles(members, externalServiceId, req.user)
    const numberOfAdminMembers = teamMembers.admin.length
    const numberOfViewOnlyMembers = teamMembers[roles['view-only'].name].length
    const numberOfViewAndRefundMembers = teamMembers[roles['view-and-refund'].name].length
    const numberActiveMembers = numberOfAdminMembers + numberOfViewOnlyMembers + numberOfViewAndRefundMembers
    const invitedTeamMembers = mapInvitesByRoles(invitedMembers)
    const inviteTeamMemberLink = formattedPathFor(paths.teamMembers.invite, externalServiceId)

    const data = {
      team_members: teamMembers,
      number_active_members: numberActiveMembers,
      inviteTeamMemberLink: inviteTeamMemberLink,
      number_admin_members: numberOfAdminMembers,
      'number_view-only_members': numberOfViewOnlyMembers,
      'number_view-and-refund_members': numberOfViewAndRefundMembers,
      invited_team_members: invitedTeamMembers,
      number_invited_members: invitedMembers.length,
      number_admin_invited_members: invitedTeamMembers.admin.length,
      'number_view-only_invited_members': invitedTeamMembers[roles['view-only'].name].length,
      'number_view-and-refund_invited_members': invitedTeamMembers[roles['view-and-refund'].name].length
    }
    return response(req, res, 'platform-admin/service-team-members', data)
  }

  return Promise.all([
    userService.getServiceUsers(externalServiceId, req.correlationId),
    userService.getInvitedUsersList(externalServiceId, req.correlationId)
  ])
    .then(onSuccess)
    .catch(err => {
      logger.error(`[requestId=${req.correlationId}] error retrieving users for service ${externalServiceId}. [${err}]`)
      renderErrorView(req, res, 'Unable to retrieve the services users')
    })
}
