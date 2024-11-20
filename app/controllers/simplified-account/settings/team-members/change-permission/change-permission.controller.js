const { findByExternalId } = require('@services/user.service')
const { response, renderErrorView } = require('@utils/response')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const { getAvailableRolesForService } = require('@utils/roles')
const { NotFoundError } = require('@root/errors')

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
    const userCurrentRole = user.getRoleForService(serviceId)
    if (userCurrentRole === undefined) {
      throw new NotFoundError('User does not have a role in this service')
    }
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
  // TODO implement change permissions
  const serviceId = req.service.externalId
  const accountType = req.account.type
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.teamMembers.index, serviceId, accountType))
}

module.exports = {
  get,
  post
}
