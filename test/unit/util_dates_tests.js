require(__dirname + '/../test_helpers/html_assertions.js');
var should = require('chai').should();
var assert = require('assert');
var dates  = require(__dirname + '/../../app/utils/dates.js');



describe('date format', function () {
  // this will need to be improved to take multiple formats
  it('should return the valid format for the api', function () {
      assert.equal("1981-11-11T00:00:00.000Z",dates.userInputToApiFormat("11/11/1981"));
  });

  it('should return the valid default format', function () {
    assert.equal("2016-01-29 17:24:48", dates.dateToDefaultFormat("2016-01-29T17:24:48Z"));
  });

  it("should return an error message for an invalid date format",function() {
    assert.equal("Invalid date",dates.userInputToApiFormat("11-11/1981"));
  });

});
