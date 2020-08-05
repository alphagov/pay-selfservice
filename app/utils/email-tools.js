'use strict'

// NPM dependencies
const rfc822Validator = require('rfc822-validate')

module.exports = (email) => {
  if (!rfc822Validator(email)) {
    return false
  } else {
    let domain = email.split('@')[1]
    return !(domain && domain.indexOf('.') === -1)
  }
}
