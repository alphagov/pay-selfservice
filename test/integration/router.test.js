const path = require('path')
require(path.join(__dirname, '/../test-helpers/html-assertions.js'))
const assert = require('assert')
const router = require(path.join(__dirname, '/../../app/routes.js'))

describe('date format', function () {
  it('should return the correct generated url with no query string', function () {
    const dynamicRoute = router.paths.account.transactions.detail
    const route = router.generateRoute(dynamicRoute, { chargeId: 'foo' })
    assert.strictEqual('/transactions/foo', route)
  })

  it('should return the correct url with paramters appended as query if they are not named', function () {
    const dynamicRoute = router.paths.account.transactions.detail
    const route = router.generateRoute(dynamicRoute, { chargeId: 'foo', foo: 'bar' })
    assert.strictEqual('/transactions/foo?foo=bar', route)
  })

  it('should remove empty params', function () {
    const dynamicRoute = router.paths.account.transactions.detail
    const route = router.generateRoute(dynamicRoute, { chargeId: 'foo', foo: 'bar', choc: 'bar', empty: '' })
    assert.strictEqual('/transactions/foo?foo=bar&choc=bar', route)
  })
})
