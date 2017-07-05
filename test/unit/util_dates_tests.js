const path = require('path')
require(path.join(__dirname, '/../test_helpers/html_assertions.js'))
const assert = require('assert')
const dates = require(path.join(__dirname, '/../../app/utils/dates.js'))

describe('date format', function () {
  // this will need to be improved to take multiple formats
  it('should return the fromDate correctly formatted for the api', function () {
    assert.equal('1981-11-21T00:00:00.000Z', dates.fromDateToApiFormat('21/11/1981', '00:00:00'))
    assert.equal('1981-11-21T00:00:00.000Z', dates.fromDateToApiFormat('21/11/1981'))
    assert.equal('1981-05-20T23:00:00.000Z', dates.fromDateToApiFormat('21/05/1981', '00:00:00'))
    assert.equal('1981-05-20T23:00:00.000Z', dates.fromDateToApiFormat('21/05/1981'))
  })

  it("should return a null response for an invalid 'fromDate' format", function () {
    assert.equal(null, dates.fromDateToApiFormat('11-11/1981'))
  })

  it('should return the toDate correctly formatted for the api', function () {
    assert.equal('1981-11-21T00:00:01.000Z', dates.toDateToApiFormat('21/11/1981', '00:00:00'))
    assert.equal('1981-11-22T00:00:00.000Z', dates.toDateToApiFormat('21/11/1981'))
    assert.equal('1981-05-20T23:00:01.000Z', dates.toDateToApiFormat('21/05/1981', '00:00:00'))
    assert.equal('1981-05-21T23:00:00.000Z', dates.toDateToApiFormat('21/05/1981'))
  })

  it("should return a null response for an invalid 'toDate' format", function () {
    assert.equal(null, dates.toDateToApiFormat('11-11/1981'))
  })

  it('should return the valid default format', function () {
    assert.equal('2016-01-29 17:24:48', dates.dateToDefaultFormat('2016-01-29T17:24:48Z'))
  })

  it('should return the valid default format in bst', function () {
    assert.equal('2016-07-07 18:24:48', dates.dateToDefaultFormat('2016-07-07T17:24:48Z'))
  })
})
