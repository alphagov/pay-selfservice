var should  = require('chai').should();
var assert  = require('assert');
var filters = require(__dirname + '/../../app/utils/filters.js');
var _       = require('lodash');
var expect  = require("chai").expect;


describe('session', function () {

  it('should return filters from query string as a new object', function(){
    var query = {
      reference: 'ref1',
      state: 'TEST_STATUS',
      fromDate: '21/01/2016',
      fromTime: '13:04:45',
      toDate: '22/01/2016',
      toTime: '14:12:18'
    };

    var filter = filters.getFilters({ query: query });
    expect(filter.valid).to.equal(true);
    expect(filter.result).to.not.equal(query);
    expect(filter.result).to.deep.equal(query);
  });

  it('should return filters from query string with empty omitted', function(){
    var query = {
      reference: 'ref1',
      state: undefined,
      fromDate: '21/01/2016',
      fromTime: '13:04:45',
      toDate: '22/01/2016',
      toTime: '14:12:18',
      pageSize: "1",
      page: "1"
    };

    var filter = filters.getFilters({ query: query });
    delete query.state;
    expect(filter.valid).to.equal(true);
    expect(filter.result).to.deep.equal(query);
  });

  it('should not validate pageSize is too big', function(){
    var query = {
      pageSize: "1000"
    };

    var filter = filters.getFilters({ query: query });
    expect(filter.valid).to.equal(false);
  });

  it('should not validate if page is negative', function(){
    var query = {
      page: "-2",
      pageSize: "50",

    };

    var filter = filters.getFilters({ query: query });
    expect(filter.valid).to.equal(false);
  });

  it('should not validate if page is positive and page is too big', function(){
    var query = {
      page: "2",
      pageSize: "5000",

    };
    var filter = filters.getFilters({ query: query });
    expect(filter.valid).to.equal(false);
  });

  it('should not validate if pageSize is fine and page is negative', function(){
    var query = {
      page: "-2",
      pageSize: "5",

    };
    var filter = filters.getFilters({ query: query });
    expect(filter.valid).to.equal(false);
  });

});
