const { findByExternalId } = require('@services/user.service')
const { response } = require('@utils/response')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const { getAvailableRolesForService } = require('@utils/roles')

async function get (req, res, next) {
  const serviceId = req.service.externalId
  const accountType = req.account.type
  const serviceHasAgentInitiatedMotoEnabled = req.service.agentInitiatedMotoEnabled
  const availableRoles = getAvailableRolesForService(serviceHasAgentInitiatedMotoEnabled)
  try {
    const { email } = await findByExternalId(req.params.externalUserId)
    response(req, res, 'simplified-account/settings/team-members/change-permission',
      {
        availableRoles,
        email,
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
