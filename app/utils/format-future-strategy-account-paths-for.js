'use strict'
const urlJoin = require('url-join')

const paths = require('./../paths')
const formattedPathFor = require('./replace-params-in-path')

function formatFutureStrategyAccountPathsFor (path, live, serviceId, gatewayAccountExternalId, ...params) {
  const completePath = urlJoin(paths.futureAccountStrategy.root, path)
  return formattedPathFor(completePath, live, serviceId, gatewayAccountExternalId, ...params)
}

module.exports = formatFutureStrategyAccountPathsFor
