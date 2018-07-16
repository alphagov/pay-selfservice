'use strict'

// NPM dependencies
const getNamespace = require('continuation-local-storage').getNamespace

// Local dependencies
const clsXrayConfig = require('../../config/xray-cls')

module.exports = (req, res, next) => {
  const namespace = getNamespace(clsXrayConfig.nameSpaceName)
  namespace.set(clsXrayConfig.segmentKeyName, req.segment)
  next()
}