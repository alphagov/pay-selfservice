const { updateServiceName } = require('@services/service.service')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')

async function post (req, res) {
  await updateServiceName(req.service.externalId, req.service.serviceName.en, '')
  req.flash('messages', { state: 'success', icon: '&check;', heading: 'Welsh service name removed' })
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.index, req.service.externalId, req.account.type))
}

module.exports = {
  post
}
