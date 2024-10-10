'use strict'

const formatSimplifiedAccountPathsFor = require('../../../utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('../../../paths')
const { LIVE } = require('../../../models/go-live-stage')

function get (req, res) {
  const account = req.account
  const service = req.service
  // the default setting for the index view is dependent on the account type and go live state
  if (account.type === 'test' && service.currentGoLiveStage !== LIVE) {
    return res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.index, req.account.service_id, req.account.type))
  } else if (account.type === 'live') {
    return res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.index, req.account.service_id, req.account.type))
  } else {
    return res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.index, req.account.service_id, req.account.type))
  }
}

module.exports = {
  get
}
