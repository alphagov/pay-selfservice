const _ = require('lodash')
let Pact = require('pact')
let matchers = Pact.Matchers

module.exports = function (options = {}) {
  let pactifySimpleArray = (arr) => {
    let pactified = []
    arr.forEach((val) => {
      pactified.push(matchers.somethingLike(val))
    })
    return pactified
  }

  let pactifyNestedArray = (arr) => {
    return matchers.eachLike(pactify(arr[0]), {min: arr.length})
  }

  let pactify = (object) => {
    let pactified = {}
    _.forIn(object, (value, key) => {
      if (options.array && options.array.indexOf(key) !== -1) {
        pactified[key] = matchers.eachLike(matchers.somethingLike(value[0]), {min: value.length})
      } else if (value.constructor === Array) {
          pactified[key] = pactifySimpleArray(value)
      } else if (value.constructor === Object) {
        pactified[key] = pactify(value)
      } else {
        pactified[key] = matchers.somethingLike(value)
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
    return matchers.term({generate: generate, matcher: matcher})
  }

  return {
    pactifyMatch: pactifyMatch,
    pactifyNestedArray: pactifyNestedArray,
    pactify: pactify,
    withPactified: withPactified
  }
}
