'use strict'

const paths = require('../../paths')

const SIX_MONTHS_IN_SECS = 60 * 60 * 24 * 30 * 6

module.exports = async function getServiceList (req, res) {
  res.cookie('govuk_pay_notifications', '{"my_services_default_page_dismissed":true}',
    {
      maxAge: SIX_MONTHS_IN_SECS,
      httpOnly: false,
      encode: String
    })

  return res.redirect(paths.serviceSwitcher.index)
}
