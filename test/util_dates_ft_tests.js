require(__dirname + '/utils/html_assertions.js');
var should = require('chai').should();
var assert = require('assert');
var dates  = require(__dirname + '/../app/utils/dates.js');



describe('user date to api date', function () {
  // this will need to be improved to take multiple formats
  it('should return the valid format for the api', function () {
      assert.equal("1981-11-11 00:00:00",dates.userInputToApiFormat("11/11/1981"));
  });

  it("should return an error message for an invalid date format",function() {
    assert.equal("Invalid date",dates.userInputToApiFormat("11-11/1981"));
  });

});
