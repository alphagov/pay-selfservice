'use strict'

const getNamespace = require('continuation-local-storage').getNamespace

const clsXrayConfig = require('../../config/xray-cls')

module.exports = (req, res, next) => {
  const namespace = getNamespace(clsXrayConfig.nameSpaceName)
  namespace.set(clsXrayConfig.segmentKeyName, req.segment)
  next()
}
