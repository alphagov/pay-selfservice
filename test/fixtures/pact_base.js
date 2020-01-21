const _ = require('lodash')
const { Matchers } = require('@pact-foundation/pact')
const { somethingLike, eachLike, term } = Matchers

module.exports = function (options = {}) {
  const pactifySimpleArray = (arr) => {
    const pactified = []
    arr.forEach((val) => {
      if (val.constructor === Object) {
        pactified.push(pactify(val))
      } else {
        pactified.push(somethingLike(val))
      }
    })
    return pactified
  }

  const pactifyNestedArray = (arr) => {
    return eachLike(pactify(arr[0]), { min: arr.length })
  }

  const pactify = (object) => {
    const pactified = {}
    _.forIn(object, (value, key) => {
      if (value === null) {
        pactified[key] = null
      } else if (options.array && options.array.indexOf(key) !== -1) {
        let length
        if (options.length && options.length.find(lengthKey => lengthKey.key === key)) {
          length = options.length.find(lengthKey => lengthKey.key === key).length
        } else {
          length = value.length
        }
        pactified[key] = eachLike(somethingLike(value[0]), { min: length })
      } else if (value.constructor === Array) {
        pactified[key] = pactifySimpleArray(value)
      } else if (value.constructor === Object) {
        pactified[key] = pactify(value)
      } else {
        pactified[key] = somethingLike(value)
      }
    })
    return pactified
  }

  const withPactified = (payload) => {
    return {
      getPlain: () => payload,
      getPactified: () => pactify(payload)
    }
  }

  const pactifyMatch = (generate, matcher) => {
    return term({ generate: generate, matcher: matcher })
  }

  return {
    pactifyMatch: pactifyMatch,
    pactifySimpleArray: pactifySimpleArray,
    pactifyNestedArray: pactifyNestedArray,
    pactify: pactify,
    withPactified: withPactified
  }
}
