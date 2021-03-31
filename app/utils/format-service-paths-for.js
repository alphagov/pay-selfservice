'use strict'
const urlJoin = require('url-join')

const paths = require('./../paths')
const formattedPathFor = require('./replace-params-in-path')

function formatServicePathsFor (path, serviceExternalId, ...params) {
  const completePath = urlJoin(paths.service.root, path)
  return formattedPathFor(completePath, serviceExternalId, ...params)
}

module.exports = formatServicePathsFor
