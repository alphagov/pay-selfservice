const _ = require('lodash')

const { renderErrorView, response } = require('../utils/response.js')
const userService = require('../services/user.service.js')
const paths = require('../paths.js')
const roles = require('../utils/roles').roles
const secondFactorMethod = require('../models/second-factor-method')

const formatServicePathsFor = require('../utils/format-service-paths-for')

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
        mappedUser.link = paths.user.profile.index
      } else {
        mappedUser.link = formatServicePathsFor(paths.service.teamMembers.show, externalServiceId, user.externalId)
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

/**
 * Team members list view
 */
async function index (req, res, next) {
  const externalServiceId = req.service.externalId

  try {
    const [members, invitedMembers] = await Promise.all([
      userService.getServiceUsers(externalServiceId),
      userService.getInvitedUsersList(externalServiceId)
    ])
    const teamMembers = mapByRoles(members, externalServiceId, req.user)
    const invitedTeamMembers = mapInvitesByRoles(invitedMembers)
    const inviteTeamMemberLink = formatServicePathsFor(paths.service.teamMembers.invite, externalServiceId)

    response(req, res, 'team-members/team-members', {
      team_members: teamMembers,
      inviteTeamMemberLink: inviteTeamMemberLink,
      invited_team_members: invitedTeamMembers,
      number_invited_members: invitedMembers.length
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Show Team member details
 */
async function show (req, res, next) {
  const externalServiceId = req.service.externalId
  const externalUserId = req.params.externalUserId
  if (externalUserId === req.user.externalId) {
    return res.redirect(paths.user.profile.index)
  }

  try {
    const user = await userService.findByExternalId(externalUserId)
    const hasSameService = user.hasService(externalServiceId) && req.user.hasService(externalServiceId)
    const roleInList = roles[_.get(user.getRoleForService(externalServiceId), 'name')]
    const editPermissionsLink = formatServicePathsFor(paths.service.teamMembers.permissions, externalServiceId, externalUserId)
    const removeTeamMemberLink = formatServicePathsFor(paths.service.teamMembers.delete, externalServiceId, externalUserId)
    const teamMemberIndexLink = formatServicePathsFor(paths.service.teamMembers.index, externalServiceId)

    if (roleInList && hasSameService) {
      return response(req, res, 'team-members/team-member-details', {
        username: user.username,
        email: user.email,
        role: roleInList.description,
        teamMemberIndexLink: teamMemberIndexLink,
        editPermissionsLink: editPermissionsLink,
        removeTeamMemberLink: removeTeamMemberLink
      })
    } else {
      return renderErrorView(req, res, 'You do not have the rights to access this service.', 403)
    }
  } catch (err) {
    next(err)
  }
}

/**
 * Delete a Team member
 */
async function remove (req, res, next) {
  const userToRemoveExternalId = req.params.externalUserId
  const externalServiceId = req.service.externalId
  const removerExternalId = req.user.externalId

  if (userToRemoveExternalId === removerExternalId) {
    renderErrorView(req, res, 'It is not possible to remove yourself from a service', 403)
    return
  }

  try {
    const user = await userService.findByExternalId(userToRemoveExternalId)
    await userService.delete(externalServiceId, removerExternalId, userToRemoveExternalId)
    req.flash('generic', user.username + ' was successfully removed')
    res.redirect(formatServicePathsFor(paths.service.teamMembers.index, externalServiceId))
  } catch (err) {
    if (err.errorCode === 404) {
      const messageUserHasBeenDeleted = {
        error: {
          title: 'This person has already been removed',
          message: 'This person has already been removed by another administrator.'
        },
        link: {
          link: formatServicePathsFor(paths.service.teamMembers.index, externalServiceId),
          text: 'View all team members'
        },
        enable_link: true
      }
      response(req, res, 'error-with-link', messageUserHasBeenDeleted)
    } else {
      next(err)
    }
  }
}

/**
 * Show 'My profile'
 */
async function profile (req, res, next) {
  try {
    const user = await userService.findByExternalId(req.user.externalId)
    response(req, res, 'team-members/team-member-profile', {
      secondFactorMethod,
      username: user.username,
      email: user.email,
      telephone_number: user.telephoneNumber,
      two_factor_auth: user.secondFactor,
      two_factor_auth_link: paths.user.profile.twoFactorAuth.index
    })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  index,
  show,
  remove,
  profile
}
