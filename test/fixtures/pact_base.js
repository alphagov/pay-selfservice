const _ = require('lodash')
const { Matchers } = require('@pact-foundation/pact')
const { somethingLike, eachLike, term } = Matchers

module.exports = function (options = {}) {
  let pactifySimpleArray = (arr) => {
    let pactified = []
    arr.forEach((val) => {
      pactified.push(somethingLike(val))
    })
    return pactified
  }

  let pactifyNestedArray = (arr) => {
    return eachLike(pactify(arr[0]), { min: arr.length })
  }

  let pactify = (object) => {
    let pactified = {}
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

  let withPactified = (payload) => {
    return {
      getPlain: () => payload,
      getPactified: () => pactify(payload)
    }
  }

  let pactifyMatch = (generate, matcher) => {
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
