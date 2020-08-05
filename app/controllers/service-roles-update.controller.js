const _ = require('lodash')
const paths = require('../paths')
const logger = require('../utils/logger')(__filename)

let rolesModule = require('../utils/roles')
const roles = rolesModule.roles
let getRole = rolesModule.getRoleByExtId

let userService = require('../services/user.service.js')

const { renderErrorView, response } = require('../utils/response')

let hasSameService = (admin, user, externalServiceId) => {
  return admin.hasService(externalServiceId) && user.hasService(externalServiceId)
}

let serviceIdMismatchView = (req, res, adminUserExternalId, targetServiceExternalId, targetUserExternalId, correlationId) => {
  logger.error(`[requestId=${correlationId}] service mismatch when admin:${adminUserExternalId} attempting to assign new role on service:${targetServiceExternalId} for user:${targetUserExternalId} without existing role`)
  renderErrorView(req, res, 'Unable to update permissions for this user')
}

const formattedPathFor = require('../utils/replace-params-in-path')

module.exports = {
  /**
   *
   * @param req
   * @param res
   * @path param externalId
   */
  index: (req, res) => {
    let correlationId = req.correlationId
    let externalUserId = req.params.externalUserId
    let serviceExternalId = req.service.externalId

    let viewData = user => {
      const editPermissionsLink = formattedPathFor(paths.teamMembers.permissions, serviceExternalId, user.externalId)
      const teamMemberIndexLink = formattedPathFor(paths.teamMembers.index, serviceExternalId)
      const teamMemberProfileLink = formattedPathFor(paths.teamMembers.show, serviceExternalId, user.externalId)

      const role = user.getRoleForService(serviceExternalId)
      return {
        email: user.email,
        editPermissionsLink,
        teamMemberIndexLink,
        teamMemberProfileLink,
        admin: {
          id: roles['admin'].extId,
          checked: _.get(role, 'name') === 'admin' ? 'checked' : ''
        },
        viewAndRefund: {
          id: roles['view-and-refund'].extId,
          checked: _.get(role, 'name') === 'view-and-refund' ? 'checked' : ''
        },
        view: {
          id: roles['view-only'].extId,
          checked: _.get(role, 'name') === 'view-only' ? 'checked' : ''
        }
      }
    }

    if (req.user.externalId === externalUserId) {
      renderErrorView(req, res, 'Not allowed to update self permission', 403)
      return
    }

    userService.findByExternalId(externalUserId, correlationId)
      .then(user => {
        if (!hasSameService(req.user, user, serviceExternalId)) {
          serviceIdMismatchView(req, res, req.user.externalId, serviceExternalId, user.externalId, correlationId)
        } else {
          response(req, res, 'team-members/team_member_permissions', viewData(user))
        }
      })
      .catch(err => {
        logger.error(`[requestId=${correlationId}] error displaying user permission view [${err}]`)
        renderErrorView(req, res, 'Unable to locate the user')
      })
  },

  /**
   *
   * @param req
   * @param res
   * @path param externalId
   */
  update: (req, res) => {
    let externalUserId = req.params.externalUserId
    let serviceExternalId = req.service.externalId
    let targetRoleExtId = parseInt(req.body['role-input'])
    let targetRole = getRole(targetRoleExtId)
    let correlationId = req.correlationId
    let onSuccess = (user) => {
      req.flash('generic', 'Permissions have been updated')
      res.redirect(303, formattedPathFor(paths.teamMembers.show, serviceExternalId, user.externalId))
    }

    if (req.user.externalId === externalUserId) {
      renderErrorView(req, res, 'Not allowed to update self permission', 403)
      return
    }

    if (!targetRole) {
      logger.error(`[requestId=${correlationId}] cannot identify role from user input ${targetRoleExtId}. possible hack`)
      renderErrorView(req, res, 'Unable to update user permission')
      return
    }

    userService.findByExternalId(externalUserId, correlationId)
      .then(user => {
        if (!hasSameService(req.user, user, serviceExternalId)) {
          serviceIdMismatchView(req, res, req.user.externalId, serviceExternalId, user.externalId, correlationId)
        } else {
          if (targetRole.name === user.getRoleForService(serviceExternalId)) {
            onSuccess(user)
          } else {
            userService.updateServiceRole(user.externalId, targetRole.name, serviceExternalId, correlationId)
              .then(onSuccess)
              .catch(err => {
                logger.error(`[requestId=${correlationId}] error updating user service role [${err}]`)
                renderErrorView(req, res, 'Unable to update user permission')
              })
          }
        }
      })
      .catch(err => {
        logger.error(`[requestId=${correlationId}] error locating user when updating user service role [${err}]`)
        renderErrorView(req, res, 'Unable to locate the user')
      })
  }
}
