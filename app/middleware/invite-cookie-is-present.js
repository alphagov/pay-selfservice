'use strict'

const { RegistrationSessionMissingError } = require('../errors')
const { INVITE_SESSION_COOKIE_NAME } = require('../utils/constants')
const { addField } = require('../utils/request-context')

module.exports = function inviteCookieIsPresent (req, res, next) {
  const cookie = req[INVITE_SESSION_COOKIE_NAME]
  if (cookie && cookie.email && cookie.code) {
    addField('invite_code', cookie.code)
    return next()
  }
  next(new RegistrationSessionMissingError('Registration cookie is not present for request'))
}
