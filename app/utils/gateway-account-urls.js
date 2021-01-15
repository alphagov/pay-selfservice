'use strict'
// check if a missed URL (404) is a URL that has been upgraded during the
// account URL structure change. When this utility is reporting few or no
// upgrades it can be removed
const urlJoin = require('url-join')
const paths = require('../paths')
const formattedPathFor = require('./replace-params-in-path')
const flattenNestedValues = require('./flatten-nested-values')

// only flatten paths once given the singleton module export patten, these
// should never change after the server spins up
const allAccountPaths = flattenNestedValues(paths.account)
const templatedAccountPaths = allAccountPaths.filter((path) => path.includes(':'))

const removeEmptyValues = (value) => !!value

function isLegacyAccountsUrl (url) {
  if (allAccountPaths.includes(url)) {
    return true
  } else {
    // the path isn't directly in the list, check to see if it's a templated value
    const numberOfUrlParts = url.split('/').filter(removeEmptyValues).length
    return templatedAccountPaths.some((templatedPath) => {
      const parts = templatedPath.split('/').filter(removeEmptyValues)
      const matches = parts

        // remove variable sections
        .filter((part) => !part.startsWith(':'))

        // ensure every part of the url structure is present in the url we're comparing against
        .every((part) => url.includes(part))

      // verify it matches and is not a subset (has less length)
      return matches && parts.length === numberOfUrlParts
    })
  }
}

function getUpgradedAccountStructureUrl (url, gatewayAccountExternalId) {
  const base = formattedPathFor(paths.account.root, gatewayAccountExternalId)
  return urlJoin(base, url)
}

module.exports = {
  isLegacyAccountsUrl,
  getUpgradedAccountStructureUrl
}
