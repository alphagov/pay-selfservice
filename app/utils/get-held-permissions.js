'use strict'

const _ = require('lodash')

module.exports = permissions => {
  const permissionMap = {}
  if (permissions) {
    _.forEach(permissions, x => {
      permissionMap[x.replace(/[-:]/g, '_')] = true
    })
  }
  return permissionMap
}
