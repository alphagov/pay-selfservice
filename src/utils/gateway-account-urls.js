'use strict'
// check if a missed URL (404) is a URL that has been upgraded during the
// account URL structure change. When this utility is reporting few or no
// upgrades it can be removed
const paths = require('../paths')
const flattenNestedValues = require('./flatten-nested-values')

// only flatten paths once given the singleton module export patten, these
// should never change after the server spins up
const allAccountPaths = flattenNestedValues(paths.account)
const templatedAccountPaths = allAccountPaths.filter((path) => path.includes(':'))

const removeEmptyValues = (value) => !!value

function removeTrailingPathForwardSlash (path = '') {
  return path.replace(/\/+$/, '')
}

function isLegacyAccountsUrl (targetUrl) {
  const url = removeTrailingPathForwardSlash(targetUrl)
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

module.exports = {
  isLegacyAccountsUrl
}
