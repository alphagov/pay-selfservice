'use strict'

const rfc822Validator = require('rfc822-validate')

function isValidEmail (email) {
  if (!rfc822Validator(email)) {
    return false
  } else {
    let domain = email.split('@')[1]
    return !(domain && domain.indexOf('.') === -1)
  }
}

function isInternalGDSEmail (email) {
  return email.includes(process.env.GDS_INTERNAL_USER_EMAIL_DOMAIN)
}

module.exports = {
  isValidEmail,
  isInternalGDSEmail
}
