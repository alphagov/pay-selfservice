const urlJoin = require('url-join')

const paths = require('./../../../paths')
const formattedPathFor = require('./../../replace-params-in-path')

function formatSimplifiedAccountPathsFor (path, serviceExternalId, accountType, ...params) {
  const completePath = urlJoin(paths.simplifiedAccount.root, path)
  return formattedPathFor(completePath, serviceExternalId, accountType, ...params)
}

module.exports = formatSimplifiedAccountPathsFor
