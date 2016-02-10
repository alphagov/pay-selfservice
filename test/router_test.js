require(__dirname + '/utils/html_assertions.js');
var should = require('chai').should();
var assert = require('assert');
var router = require(__dirname + '/../app/routes.js');



describe('date format', function () {
  it('should return the correct generated url with no query string', function () {
    dynamicRoute = router.paths.transactions.show;
    route = router.generateRoute(dynamicRoute,{chargeId: 'foo'});
    assert.equal("/selfservice/transactions/foo",route);
  });

  it('should return the correct url with paramters appended as query if they are not named', function () {
    dynamicRoute = router.paths.transactions.show;
    route = router.generateRoute(dynamicRoute,{chargeId: 'foo', foo: 'bar'});
    assert.equal("/selfservice/transactions/foo?foo=bar",route);
  });

  it('should remove empty params', function () {
    dynamicRoute = router.paths.transactions.show;
    route = router.generateRoute(dynamicRoute,{chargeId: 'foo', foo: 'bar', choc: "bar", empty: ""});
    assert.equal("/selfservice/transactions/foo?foo=bar&choc=bar",route);
  });
});
