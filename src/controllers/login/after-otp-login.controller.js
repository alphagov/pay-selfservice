'use strict'

const logger = require('../../utils/logger')(__filename)
const { setSessionVersion } = require('../../services/auth.service')

module.exports = (req, res) => {
  req.session.secondFactor = 'totp'
  const redirectUrl = req.session.last_url || '/'
  delete req.session.last_url
  logger.info('Successfully entered a valid 2fa token')
  setSessionVersion(req)
  res.redirect(redirectUrl)
}
