'use strict'

const { RegistrationSessionMissingError } = require('../errors')
const { INVITE_SESSION_COOKIE_NAME } = require('../utils/constants')
const { addField } = require('../utils/request-context')
const { isInternalGDSEmail } = require('../utils/email-tools')

module.exports = function inviteCookieIsPresent (req, res, next) {
  const cookie = req[INVITE_SESSION_COOKIE_NAME]
  if (cookie && cookie.email && cookie.code) {
    addField('invite_code', cookie.code)
    addField('internal_user', isInternalGDSEmail(cookie.email))
    return next()
  }
  next(new RegistrationSessionMissingError('Registration cookie is not present for request'))
}
