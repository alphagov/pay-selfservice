'use strict'
const urlJoin = require('url-join')

const paths = require('./../paths')
const formattedPathFor = require('./replace-params-in-path')

function formatAccountPathsFor (path, gatewayAccountExternalId, ...params) {
  const completePath = urlJoin(paths.account.root, path)
  return formattedPathFor(completePath, gatewayAccountExternalId, ...params)
}

module.exports = formatAccountPathsFor
