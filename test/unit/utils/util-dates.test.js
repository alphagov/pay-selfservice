require('../../test-helpers/html-assertions.js')
var assert = require('assert')
var dates = require('../../../app/utils/dates.js')

describe('date format', function () {
  // this will need to be improved to take multiple formats
  it('should return the fromDate correctly formatted for the api', function () {
    assert.strictEqual('1981-11-21T00:00:00.000Z', dates.fromDateToApiFormat('21/11/1981', '00:00:00'))
    assert.strictEqual('1981-11-21T00:00:00.000Z', dates.fromDateToApiFormat('21/11/1981'))
    assert.strictEqual('1981-05-20T23:00:00.000Z', dates.fromDateToApiFormat('21/05/1981', '00:00:00'))
    assert.strictEqual('1981-05-20T23:00:00.000Z', dates.fromDateToApiFormat('21/05/1981'))
  })

  it("should return a null response for an invalid 'fromDate' format", function () {
    assert.strictEqual(null, dates.fromDateToApiFormat('11-11/1981'))
  })

  it('should return the toDate correctly formatted for the api', function () {
    assert.strictEqual('1981-11-21T00:00:01.000Z', dates.toDateToApiFormat('21/11/1981', '00:00:00'))
    assert.strictEqual('1981-11-22T00:00:00.000Z', dates.toDateToApiFormat('21/11/1981'))
    assert.strictEqual('1981-05-20T23:00:01.000Z', dates.toDateToApiFormat('21/05/1981', '00:00:00'))
    assert.strictEqual('1981-05-21T23:00:00.000Z', dates.toDateToApiFormat('21/05/1981'))
  })

  it("should return a null response for an invalid 'toDate' format", function () {
    assert.strictEqual(null, dates.toDateToApiFormat('11-11/1981'))
  })

  it('should return the valid default format', function () {
    assert.strictEqual('2016-01-29 17:24:48', dates.dateToDefaultFormat('2016-01-29T17:24:48Z'))
  })

  it('should return the valid default format in bst', function () {
    assert.strictEqual('2016-07-07 18:24:48', dates.dateToDefaultFormat('2016-07-07T17:24:48Z'))
  })
})
