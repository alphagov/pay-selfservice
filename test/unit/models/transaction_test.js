require(__dirname + '/../../test_helpers/html_assertions.js');
var should    = require('chai').should();
var assert    = require('assert');
var Transaction = require(__dirname + '/../../../app/models/transaction.js');
var nock      = require('nock');
var wrongPromise = function(data){
  throw new Error('Promise was unexpectedly fulfilled.');
};

var aCorrelationHeader = {
  reqheaders: {
    'x-request-id': 'some-unique-id'
  }
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
        var transactionModel = Transaction("some-unique-id");
        return transactionModel.search(123,{}).then(wrongPromise,
            function rejected(error){
              assert.equal(error.message,"CLIENT_UNAVAILABLE")
            }
          );
        }
      );
    });

    describe('when connector returns incorrect response code while retrieving the list of transactions', function () {
      before(function() {
        nock.cleanAll();

        nock(process.env.CONNECTOR_URL, aCorrelationHeader)
          .get("/v1/api/accounts/123/charges?reference=&email=&state=&card_brand=&from_date=&to_date=&page=1&display_size=100")
          .reply(404, '');
      });

      it('should return get_failed', function () {
        var transactionModel = Transaction("some-unique-id");
        return transactionModel.search(123,{}).then(wrongPromise,
          function rejected(error){
            assert.equal(error.message,"GET_FAILED")
          });
        });
      });

    describe('when connector returns correctly', function () {
      before(function() {
        nock.cleanAll();

        nock(process.env.CONNECTOR_URL)
          .get("/v1/api/accounts/123/charges?reference=&email=&state=&card_brand=&from_date=&to_date=&page=1&display_size=100")
          .reply(200, {});
      });

      it('should return the correct promise', function () {
        var transactionModel = Transaction("some-unique-id");
        return transactionModel.search(123,{}).then(function(data){
          assert.equal(1,1);
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
        var transactionModel = Transaction("some-unique-id");
        return transactionModel.searchAll(123,{pageSize: 1, page: 100}).then(wrongPromise,
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
          .get("/v1/api/accounts/123/charges?reference=&email=&state=&card_brand=&from_date=&to_date=&page=1&display_size=100")
          .reply(404, '');
      });

      it('should return GET_FAILED', function () {
        var transactionModel = Transaction("some-unique-id");
        return transactionModel.searchAll(123,{pageSize: 100, page: 1}).then(wrongPromise,
          function rejected(error){
            assert.equal(error.message,"GET_FAILED")
          });
        });
      });

    describe('when connector returns correctly', function () {
      before(function() {
        nock.cleanAll();

        nock(process.env.CONNECTOR_URL)
          .get("/v1/api/accounts/123/charges?reference=&email=&state=&card_brand=&from_date=&to_date=&page=1&display_size=100")
          .reply(200, {});
      });

      it('should return into the correct promise', function () {
        var transactionModel = Transaction("some-unique-id");
        return transactionModel.searchAll(123,{pageSize: 100, page: 1}).then(function(data){
          assert.equal(1,1);
        },wrongPromise);
      });
    });
  });
});
