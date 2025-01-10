'use strict'

module.exports = str => {
  if (str === undefined) return
  return str.charAt(0).toUpperCase() + str.slice(1)
}
