const _ = require('lodash')
const paths = require('../paths')
const logger = require('../utils/logger')(__filename)

const rolesModule = require('../utils/roles')
const roles = rolesModule.roles
const getRole = rolesModule.getRoleByExtId

const userService = require('../services/user.service.js')

const { renderErrorView, response } = require('../utils/response')

const hasSameService = (admin, user, externalServiceId) => {
  return admin.hasService(externalServiceId) && user.hasService(externalServiceId)
}

const serviceIdMismatchView = (req, res, adminUserExternalId, targetServiceExternalId, targetUserExternalId) => {
  logger.error(`Service mismatch when admin:${adminUserExternalId} attempting to assign new role on service:${targetServiceExternalId} for user:${targetUserExternalId} without existing role`)
  return renderErrorView(req, res, 'Unable to update permissions for this user')
}

const formatServicePathsFor = require('../utils/format-service-paths-for')

async function index (req, res, next) {
  const externalUserId = req.params.externalUserId
  const serviceExternalId = req.service.externalId
  const serviceHasAgentInitiatedMotoEnabled = req.service.agentInitiatedMotoEnabled

  const viewData = user => {
    const editPermissionsLink = formatServicePathsFor(paths.service.teamMembers.permissions, serviceExternalId, user.externalId)
    const teamMemberIndexLink = formatServicePathsFor(paths.service.teamMembers.index, serviceExternalId)
    const teamMemberProfileLink = formatServicePathsFor(paths.service.teamMembers.show, serviceExternalId, user.externalId)

    const role = user.getRoleForService(serviceExternalId)
    return {
      email: user.email,
      editPermissionsLink,
      teamMemberIndexLink,
      teamMemberProfileLink,
      serviceHasAgentInitiatedMotoEnabled,
      admin: {
        id: roles.admin.extId,
        checked: _.get(role, 'name') === 'admin' ? 'checked' : ''
      },
      viewAndRefund: {
        id: roles['view-and-refund'].extId,
        checked: _.get(role, 'name') === 'view-and-refund' ? 'checked' : ''
      },
      view: {
        id: roles['view-only'].extId,
        checked: _.get(role, 'name') === 'view-only' ? 'checked' : ''
      },
      viewAndInitiateMoto: {
        id: roles['view-and-initiate-moto'].extId,
        checked: _.get(role, 'name') === 'view-and-initiate-moto' ? 'checked' : ''
      },
      viewRefundAndInitiateMoto: {
        id: roles['view-refund-and-initiate-moto'].extId,
        checked: _.get(role, 'name') === 'view-refund-and-initiate-moto' ? 'checked' : ''
      }
    }
  }

  if (req.user.externalId === externalUserId) {
    return renderErrorView(req, res, 'Not allowed to update self permission', 403)
  }

  try {
    const user = await userService.findByExternalId(externalUserId)
    if (!hasSameService(req.user, user, serviceExternalId)) {
      return serviceIdMismatchView(req, res, req.user.externalId, serviceExternalId, user.externalId)
    } else {
      return response(req, res, 'team-members/team-member-permissions', viewData(user))
    }
  } catch (err) {
    next(err)
  }
}

async function update (req, res, next) {
  const externalUserId = req.params.externalUserId
  const serviceExternalId = req.service.externalId
  const targetRoleExtId = parseInt(req.body['role-input'])
  const targetRole = getRole(targetRoleExtId)
  const onSuccess = (user) => {
    req.flash('generic', 'Permissions have been updated')
    res.redirect(303, formatServicePathsFor(paths.service.teamMembers.show, serviceExternalId, user.externalId))
  }

  if (req.user.externalId === externalUserId) {
    return renderErrorView(req, res, 'Not allowed to update self permission', 403)
  }

  if (!targetRole) {
    logger.error(`Cannot identify role from user input ${targetRoleExtId}. possible hack`)
    return renderErrorView(req, res, 'Unable to update user permission')
  }

  try {
    const user = await userService.findByExternalId(externalUserId)
    if (!hasSameService(req.user, user, serviceExternalId)) {
      serviceIdMismatchView(req, res, req.user.externalId, serviceExternalId, user.externalId)
    } else {
      if (targetRole.name === user.getRoleForService(serviceExternalId)) {
        return onSuccess(user)
      } else {
        await userService.updateServiceRole(user.externalId, targetRole.name, serviceExternalId)
        return onSuccess(user)
      }
    }
  } catch (err) {
    next(err)
  }
}

module.exports = {
  index,
  update
}
