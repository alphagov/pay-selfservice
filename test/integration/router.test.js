var path = require('path')
require(path.join(__dirname, '/../test-helpers/html-assertions.js'))
var assert = require('assert')
var router = require(path.join(__dirname, '/../../app/routes.js'))

describe('date format', () => {
  it(
    'should return the correct generated url with no query string',
    () => {
      var dynamicRoute = router.paths.transactions.detail
      var route = router.generateRoute(dynamicRoute, { chargeId: 'foo' })
      assert.strictEqual('/transactions/foo', route)
    }
  )

  it(
    'should return the correct url with paramters appended as query if they are not named',
    () => {
      var dynamicRoute = router.paths.transactions.detail
      var route = router.generateRoute(dynamicRoute, { chargeId: 'foo', foo: 'bar' })
      assert.strictEqual('/transactions/foo?foo=bar', route)
    }
  )

  it('should remove empty params', () => {
    var dynamicRoute = router.paths.transactions.detail
    var route = router.generateRoute(dynamicRoute, { chargeId: 'foo', foo: 'bar', choc: 'bar', empty: '' })
    assert.strictEqual('/transactions/foo?foo=bar&choc=bar', route)
  })
})
