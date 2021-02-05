'use strict'

const paths = require('../../paths')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')

function get (req, res) {
  if (process.env.ENABLE_MY_SERVICES_AS_DEFAULT_VIEW === 'true') {
    res.redirect(paths.serviceSwitcher.index)
  } else {
    res.redirect(formatAccountPathsFor(paths.account.dashboard.index, req.account.external_id))
  }
}

module.exports = {
  get
}
