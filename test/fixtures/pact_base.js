const _ = require('lodash')
const { Matchers } = require('@pact-foundation/pact')
const { somethingLike, eachLike, term, string } = Matchers

const matchers = {
  AN_ARRAY_WITH_LENGTH: 0,
  EXACT_STRING: 1
}

const pactifySimpleArray = (arr, matchOptions = {}) => {
  const pactified = []
  arr.forEach((val) => {
    if (val.constructor === Object) {
      pactified.push(pactify(val, matchOptions))
    } else {
      pactified.push(somethingLike(val))
    }
  })
  return pactified
}

const pactifyNestedArray = (arr, matchOptions = {}) => {
  return eachLike(pactify(arr[0], matchOptions), { min: arr.length })
}

const pactify = (object, matchOptions = {}) => {
  const pactified = {}
  _.forIn(object, (value, key) => {
    if (value === null) {
      pactified[key] = null
    } else if (key in matchOptions) {
      if (matchOptions[key] === matchers.AN_ARRAY_WITH_LENGTH) {
        pactified[key] = eachLike(somethingLike(value[0]), { min: value.length })
      } else if (matchOptions[key] === matchers.EXACT_STRING) {
        pactified[key] = string(value)
      }
    } else if (value.constructor === Array) {
      pactified[key] = pactifySimpleArray(value, matchOptions)
    } else if (value.constructor === Object) {
      pactified[key] = pactify(value, matchOptions)
    } else {
      pactified[key] = somethingLike(value)
    }
  })
  return pactified
}

const withPactified = (payload, matchOptions = {}) => {
  return {
    getPlain: () => payload,
    getPactified: () => pactify(payload, matchOptions)
  }
}

const pactifyMatch = (generate, matcher) => {
  return term({ generate: generate, matcher: matcher })
}

module.exports = {
  pactifyMatch,
  pactifySimpleArray,
  pactifyNestedArray,
  pactify,
  withPactified,
  matchers
}
