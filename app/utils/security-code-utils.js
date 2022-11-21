'use strict'

function sanitiseSecurityCode (code) {
  return code && code.replace(/[\s-–]/g, '')
}

module.exports = {
  sanitiseSecurityCode
}
