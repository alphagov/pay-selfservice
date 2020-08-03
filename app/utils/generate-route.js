var _ = require('lodash')
var querystring = require('querystring')

module.exports = function (route, params) {
  var copiedParams = _.cloneDeep(params)

  var init = function () {
    _.forEach(copiedParams, checkNamedParams)
    var query = constructQueryString()
    return route + query
  }

  var checkNamedParams = function (value, key) {
    var hasNamedParam = route.indexOf(':' + key) !== -1
    if (!hasNamedParam) return
    replaceAndDeleteNamedParam(key, value)
  }

  var replaceAndDeleteNamedParam = function (key, value) {
    route = route.replace(':' + key, value)
    delete copiedParams[key]
  }

  var constructQueryString = function () {
    var validParams = _.omitBy(copiedParams, _.isEmpty, _.isUndefined)
    if (Object.keys(validParams).length === 0) return ''
    return ['?', querystring.stringify(validParams)].join('')
  }

  return init()
}
