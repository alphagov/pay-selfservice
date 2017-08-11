var path = require('path')
require(path.join(__dirname, '/../test_helpers/html_assertions.js'))
var assert = require('assert')
var router = require(path.join(__dirname, '/../../app/routes.js'))

describe('date format', function () {
  it('should return the correct generated url with no query string', function () {
    var dynamicRoute = router.paths.transactions.detail
    var route = router.generateRoute(dynamicRoute, {chargeId: 'foo'})
    assert.equal('/transactions/foo', route)
  })

  it('should return the correct url with paramters appended as query if they are not named', function () {
    var dynamicRoute = router.paths.transactions.detail
    var route = router.generateRoute(dynamicRoute, {chargeId: 'foo', foo: 'bar'})
    assert.equal('/transactions/foo?foo=bar', route)
  })

  it('should remove empty params', function () {
    var dynamicRoute = router.paths.transactions.detail
    var route = router.generateRoute(dynamicRoute, {chargeId: 'foo', foo: 'bar', choc: 'bar', empty: ''})
    assert.equal('/transactions/foo?foo=bar&choc=bar', route)
  })
})
