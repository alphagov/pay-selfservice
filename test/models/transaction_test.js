require(__dirname + '/../test_helpers/html_assertions.js');
var should    = require('chai').should();
var assert    = require('assert');
var Transaction = require(__dirname + '/../../app/models/transaction.js');
var nock      = require('nock');
var wrongPromise = function(data){
  throw new Error('Promise was unexpectedly fulfilled.');
};

describe('transaction model', function() {
  describe('search', function(){

    describe('when connector is unavailable', function () {
      before(function() {
        nock.cleanAll();
      });

      after(function() {
        nock.cleanAll();
      });

      it('should return client unavailable', function () {
        return Transaction.search(123,{}).then(wrongPromise,
            function rejected(error){
              assert.equal(error.message,"CLIENT_UNAVAILABLE")
            }
          );
        }
      );
    });

    describe('when connector returns incorrect response code', function () {
      before(function() {
        nock.cleanAll();

        nock(process.env.CONNECTOR_URL)
          .get("/v1/api/accounts/123/charges?reference=&state=&from_date=&to_date=&page=&display_size=")
          .reply(404, '');
      });

      it('should return delete_failed', function () {
        return Transaction.search(123,{}).then(wrongPromise,
          function rejected(error){
            assert.equal(error.message,"GET_FAILED")
          });
        });
      });

    describe('when connector returns correctly', function () {
      before(function() {
        nock.cleanAll();

        nock(process.env.CONNECTOR_URL)
          .get("/v1/api/accounts/123/charges?reference=&state=&from_date=&to_date=&page=&display_size=")
          .reply(200, {});
      });

      it('should return delete_failed', function () {
        return Transaction.search(123,{}).then(function(data){

        },wrongPromise);
      });
    });
  });

  describe('searchAll', function(){

    describe('when connector is unavailable', function () {
      before(function() {
        nock.cleanAll();
      });

      after(function() {
        nock.cleanAll();
      });

      it('should return client unavailable', function () {
        return Transaction.searchAll(123,{pageSize: 1, page: 100}).then(wrongPromise,
            function rejected(error){
              assert.equal(error.message,"CLIENT_UNAVAILABLE")
            }
          );
        }
      );
    });

    describe('when connector returns incorrect response code', function () {
      before(function() {
        nock.cleanAll();

        nock(process.env.CONNECTOR_URL)
          .get("/v1/api/accounts/123/charges?reference=&state=&from_date=&to_date=&page=&display_size=")
          .reply(404, '');
      });

      it('should return delete_failed', function () {
        return Transaction.searchAll(123,{pageSize: 1, page: 100}).then(wrongPromise,
          function rejected(error){
            assert.equal(error.message,"GET_FAILED")
          });
        });
      });

    describe('when connector returns correctly', function () {
      before(function() {
        nock.cleanAll();

        nock(process.env.CONNECTOR_URL)
          .get("/v1/api/accounts/123/charges?reference=&state=&from_date=&to_date=&page=&display_size=")
          .reply(200, {});
      });

      it('should return delete_failed', function () {
        return Transaction.searchAll(123,{pageSize: 1, page: 100}).then(function(data){

        },wrongPromise);
      });
    });
  });
});
