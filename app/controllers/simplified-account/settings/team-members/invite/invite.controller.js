const { response } = require('@utils/response')
const { getAvailableRolesForService } = require('@utils/roles')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')

async function get (req, res) {
  const serviceId = req.service.externalId
  const accountType = req.account.type
  const serviceHasAgentInitiatedMotoEnabled = req.service.agentInitiatedMotoEnabled ?? false
  const availableRoles = getAvailableRolesForService(serviceHasAgentInitiatedMotoEnabled)
  response(req, res, 'simplified-account/settings/team-members/invite',
    {
      availableRoles,
      backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.teamMembers.index, serviceId, accountType)
    })
}

async function post (req, res, next) {
  // TODO
}

module.exports = {
  get,
  post
}
