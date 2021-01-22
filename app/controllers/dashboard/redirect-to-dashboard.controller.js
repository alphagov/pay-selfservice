'use strict'

const paths = require('../../paths')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')

module.exports = function redirectToDashboard (req, res) {
  const dashboardPath = formatAccountPathsFor(paths.account.dashboard.index, req.account.external_id)
  res.redirect(303, dashboardPath)
}
