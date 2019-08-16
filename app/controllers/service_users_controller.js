const _ = require('lodash')
const { createLogger, format } = require('winston')
const { timestamp, json } = format
const logger = createLogger({
  format: format.combine(
    timestamp(),
    json()
  )
})
const response = require('../utils/response.js')
const userService = require('../services/user_service.js')
const paths = require('../paths.js')
const successResponse = response.response
const errorResponse = response.renderErrorView
const roles = require('../utils/roles').roles

const formattedPathFor = require('../utils/replace_params_in_path')

const mapByRoles = function (users, externalServiceId, currentUser) {
  const userRolesMap = {}
  for (const role in roles) {
    userRolesMap[roles[role].name] = []
  }
  users.map((user) => {
    const userRoleName = _.get(user.getRoleForService(externalServiceId), 'name')
    if (roles[userRoleName]) {
      const mappedUser = {
        username: user.username,
        external_id: user.externalId
      }
      if (currentUser.externalId === user.externalId) {
        mappedUser.is_current = true
        mappedUser.link = paths.user.profile
      } else {
        mappedUser.link = formattedPathFor(paths.teamMembers.show, externalServiceId, user.externalId)
      }
      userRolesMap[userRoleName].push(mappedUser)
    }
  })
  return userRolesMap
}

const mapInvitesByRoles = function (invitedUsers) {
  const userRolesMap = {}
  for (const role in roles) {
    userRolesMap[roles[role].name] = []
  }
  invitedUsers.map((user) => {
    if (roles[user.role]) {
      const mappedUser = {
        username: user.email,
        expired: user.expired
      }
      userRolesMap[user.role].push(mappedUser)
    }
  })
  return userRolesMap
}
module.exports = {

  /**
   * Team members list view
   * @param req
   * @param res
   */
  index: (req, res) => {
    const externalServiceId = req.service.externalId

    const onSuccess = function ([members, invitedMembers]) {
      const teamMembers = mapByRoles(members, externalServiceId, req.user)
      const numberOfAdminMembers = teamMembers.admin.length
      const numberOfViewOnlyMembers = teamMembers[roles['view-only'].name].length
      const numberOfViewAndRefundMembers = teamMembers[roles['view-and-refund'].name].length
      const numberActiveMembers = numberOfAdminMembers + numberOfViewOnlyMembers + numberOfViewAndRefundMembers
      const invitedTeamMembers = mapInvitesByRoles(invitedMembers)
      const inviteTeamMemberLink = formattedPathFor(paths.teamMembers.invite, externalServiceId)

      successResponse(req, res, 'team-members/team_members', {
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
      })
    }
    return Promise.all([
      userService.getServiceUsers(externalServiceId, req.correlationId),
      userService.getInvitedUsersList(externalServiceId, req.correlationId)
    ])
      .then(onSuccess)
      .catch((err) => {
        logger.error(`[requestId=${req.correlationId}] error retrieving users for service ${externalServiceId}. [${err}]`)
        errorResponse(req, res, 'Unable to retrieve the services users')
      })
  },

  /**
   * Show Team member details
   * @param req
   * @param res
   */
  show: (req, res) => {
    const externalServiceId = req.service.externalId
    const externalUserId = req.params.externalUserId
    if (externalUserId === req.user.externalId) {
      res.redirect(paths.user.profile)
    }

    const onSuccess = (user) => {
      const hasSameService = user.hasService(externalServiceId) && req.user.hasService(externalServiceId)
      const roleInList = roles[_.get(user.getRoleForService(externalServiceId), 'name')]
      const editPermissionsLink = formattedPathFor(paths.teamMembers.permissions, externalServiceId, externalUserId)
      const removeTeamMemberLink = formattedPathFor(paths.teamMembers.delete, externalServiceId, externalUserId)
      const teamMemberIndexLink = formattedPathFor(paths.teamMembers.index, externalServiceId)

      if (roleInList && hasSameService) {
        successResponse(req, res, 'team-members/team_member_details', {
          username: user.username,
          email: user.email,
          role: roleInList.description,
          teamMemberIndexLink: teamMemberIndexLink,
          editPermissionsLink: editPermissionsLink,
          removeTeamMemberLink: removeTeamMemberLink
        })
      } else {
        errorResponse(req, res, 'You do not have the rights to access this service.')
      }
    }

    return userService.findByExternalId(externalUserId)
      .then(onSuccess)
      .catch(() => errorResponse(req, res, 'Unable to retrieve user'))
  },

  /**
   * Delete a Team member
   * @param req
   * @param res
   */
  delete: (req, res) => {
    const userToRemoveExternalId = req.params.externalUserId
    const externalServiceId = req.service.externalId
    const removerExternalId = req.user.externalId
    const correlationId = req.correlationId

    if (userToRemoveExternalId === removerExternalId) {
      errorResponse(req, res, 'Not allowed to delete a user itself')
      return
    }

    const onSuccess = (username) => {
      req.flash('generic', username + ' was successfully removed')
      res.redirect(formattedPathFor(paths.teamMembers.index, externalServiceId))
    }

    const onError = () => {
      const messageUserHasBeenDeleted = {
        error: {
          title: 'This person has already been removed',
          message: 'This person has already been removed by another administrator.'
        },
        link: {
          link: formattedPathFor(paths.teamMembers.index, externalServiceId),
          text: 'View all team members'
        },
        enable_link: true
      }
      successResponse(req, res, 'error_logged_in', messageUserHasBeenDeleted)
    }

    return userService.findByExternalId(userToRemoveExternalId, correlationId)
      .then(user => userService.delete(externalServiceId, removerExternalId, userToRemoveExternalId, correlationId).then(() => user.username))
      .then((username) => onSuccess(username))
      .catch(onError)
  },

  /**
   * Show 'My profile'
   * @param req
   * @param res
   */
  profile: (req, res) => {
    const onSuccess = (user) => {
      successResponse(req, res, 'team-members/team_member_profile', {
        username: user.username,
        email: user.email,
        telephone_number: user.telephoneNumber,
        two_factor_auth: user.secondFactor,
        two_factor_auth_link: paths.user.twoFactorAuth.index
      })
    }

    return userService.findByExternalId(req.user.externalId)
      .then(onSuccess)
      .catch(() => errorResponse(req, res, 'Unable to retrieve user'))
  }
}
