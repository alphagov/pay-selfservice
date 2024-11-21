const { findByExternalId, updateServiceRole } = require('@services/user.service')
const { response, renderErrorView } = require('@utils/response')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const { getAvailableRolesForService } = require('@utils/roles')
const { NotFoundError } = require('@root/errors')

const getUsersCurrentRoleForServiceOrError = (user, serviceId) => {
  const userCurrentRole = user.getRoleForService(serviceId)
  if (userCurrentRole === undefined) {
    throw new NotFoundError('User does not have a role in this service')
  }
  return userCurrentRole
}

async function get (req, res, next) {
  if (req.user.externalId === req.params.externalUserId) {
    return renderErrorView(req, res, 'You cannot update your own permissions', 403)
  }
  const serviceId = req.service.externalId
  const accountType = req.account.type
  const serviceHasAgentInitiatedMotoEnabled = req.service.agentInitiatedMotoEnabled ?? false
  const availableRoles = getAvailableRolesForService(serviceHasAgentInitiatedMotoEnabled)
  try {
    const user = await findByExternalId(req.params.externalUserId)
    const userCurrentRole = getUsersCurrentRoleForServiceOrError(user, serviceId)
    response(req, res, 'simplified-account/settings/team-members/change-permission',
      {
        availableRoles,
        userCurrentRoleName: userCurrentRole.name,
        email: user.email,
        serviceHasAgentInitiatedMotoEnabled,
        backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.teamMembers.index, serviceId, accountType)
      })
  } catch (err) {
    next(err)
  }
}

async function post (req, res, next) {
  const serviceId = req.service.externalId
  const accountType = req.account.type
  const newRole = req.body.newRole
  if (req.user.externalId === req.params.externalUserId) {
    return renderErrorView(req, res, 'You cannot update your own permissions', 403)
  }
  try {
    const user = await findByExternalId(req.params.externalUserId)
    const currentRole = getUsersCurrentRoleForServiceOrError(user, serviceId)
    if (currentRole.name !== newRole) {
      await updateServiceRole(user.externalId, newRole, serviceId)
      req.flash('messages', { state: 'success', icon: '&check;', heading: 'Permissions have been updated' })
    }
    res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.teamMembers.index, serviceId, accountType))
  } catch (err) {
    next(err)
  }
}

module.exports = {
  get,
  post
}
