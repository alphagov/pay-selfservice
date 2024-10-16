const _ = require('lodash')
const querystring = require('querystring')

module.exports = function (route, params) {
  const copiedParams = _.cloneDeep(params)

  const init = function () {
    _.forEach(copiedParams, checkNamedParams)
    const query = constructQueryString()
    return route + query
  }

  var checkNamedParams = function (value, key) {
    const hasNamedParam = route.indexOf(':' + key) !== -1
    if (!hasNamedParam) return
    replaceAndDeleteNamedParam(key, value)
  }

  var replaceAndDeleteNamedParam = function (key, value) {
    route = route.replace(':' + key, value)
    delete copiedParams[key]
  }

  var constructQueryString = function () {
    const validParams = _.omitBy(copiedParams, _.isEmpty, _.isUndefined)
    if (Object.keys(validParams).length === 0) return ''
    return ['?', querystring.stringify(validParams)].join('')
  }

  return init()
}
