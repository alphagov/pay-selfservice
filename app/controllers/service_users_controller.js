const response = require('../utils/response.js')
const userService = require('../services/user_service.js')
const paths = require('../paths.js')
const successResponse = response.response
const errorResponse = response.renderErrorView
const roles = require('../utils/roles').roles

const mapByRoles = function (users, currentUser) {
  const userRolesMap = {}
  for (const role in roles) {
    userRolesMap[roles[role].name] = []
  }
  users.map((user) => {
    if (roles[user.role.name]) {
      const mappedUser = {
        username: user.username,
        external_id: user.external_id
      }
      if (currentUser.externalId === user.external_id) {
        mappedUser.is_current = true
        mappedUser.link = paths.user.profile
      } else {
        mappedUser.link = paths.teamMembers.show.replace(':externalId', user.external_id)
      }
      userRolesMap[user.role.name].push(mappedUser)
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
    const onSuccess = function (data) {
      const teamMembers = mapByRoles(data, req.user)
      const numberOfAdminMembers = teamMembers.admin.length
      const numberOfViewOnlyMembers = teamMembers[roles['view-only'].name].length
      const numberOfViewAndRefundMembers = teamMembers[roles['view-and-refund'].name].length
      const numberActiveMembers = numberOfAdminMembers + numberOfViewOnlyMembers + numberOfViewAndRefundMembers

      successResponse(req, res, 'services/team_members', {
        team_members: teamMembers,
        number_active_members: numberActiveMembers,
        number_admin_members: numberOfAdminMembers,
        'number_view-only_members': numberOfViewOnlyMembers,
        'number_view-and-refund_members': numberOfViewAndRefundMembers
      })
    }

    return userService.getServiceUsers(req.user.serviceIds[0], req.correlationId)
      .then(onSuccess)
      .catch(() => errorResponse(req, res, 'Unable to retrieve the services users'))
  },

  /**
   * Show Team member details
   * @param req
   * @param res
   */
  show: (req, res) => {
    const externalId = req.params.externalId
    if (externalId === req.user.externalId) {
      res.redirect(paths.user.profile)
    }

    const onSuccess = (user) => {
      const hasSameService = user.serviceIds[0] === req.user.serviceIds[0]
      const roleInList = roles[user._role.name]
      const editPermissionsLink = paths.teamMembers.permissions.replace(':externalId', user.externalId)
      const removeTeamMemberLink = paths.teamMembers.delete.replace(':externalId', user.externalId)

      if (roleInList && hasSameService) {
        successResponse(req, res, 'services/team_member_details', {
          username: user.username,
          email: user.email,
          role: roles[user.role.name].description,
          editPermissionsLink: editPermissionsLink,
          removeTeamMemberLink: removeTeamMemberLink
        })
      } else {
        errorResponse(req, res, 'Error displaying this user of the current service')
      }
    }

    return userService.findByExternalId(externalId)
      .then(onSuccess)
      .catch(() => errorResponse(req, res, 'Unable to retrieve user'))
  },

  /**
   * Delete a Team member
   * @param req
   * @param res
   */
  delete: (req, res) => {
    const userToRemoveId = req.params.externalId
    const removerId = req.user.externalId
    const serviceId = req.user.services[0].external_id
    const correlationId = req.correlationId

    if (userToRemoveId === removerId) {
      errorResponse(req, res, 'Not allowed to delete a user itself')
      return
    }

    const onSuccess = (username) => {
      req.flash('generic', username + ' was successfully removed')
      res.redirect(paths.teamMembers.index)
    }

    const onError = () => {
      const messageUserHasBeenDeleted = {
        error: {
          title: 'This person has already been removed',
          message: 'This person has already been removed by another administrator.'
        },
        link: {
          link: '/team-members',
          text: 'View all team members'
        },
        enable_link: true
      }
      successResponse(req, res, 'error_logged_in', messageUserHasBeenDeleted)
    }

    return userService.findByExternalId(userToRemoveId, correlationId)
      .then(user => userService.delete(serviceId, removerId, userToRemoveId, correlationId).then(() => user.username))
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
      successResponse(req, res, 'services/team_member_profile', {
        username: user.username,
        email: user.email,
        telephone_number: user.telephoneNumber
      })
    }

    return userService.findByExternalId(req.user.externalId)
      .then(onSuccess)
      .catch(() => errorResponse(req, res, 'Unable to retrieve user'))
  }
}
