'use strict'

const moment = require('moment')
const paths = require('../../paths')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')

module.exports = (req, res) => {
  // req.session.prototype = req.session.prototype || {}
  req.currentAccountPrototype.switchComplete = true
  req.currentAccountPrototype.switchDate = moment().format('D MMMM YYYY')

  req.flash('success', 'provider switched')
  res.redirect(formatAccountPathsFor(paths.account.yourPsp.switch, req.account.external_id))
}
