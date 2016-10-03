require(__dirname + '/../test_helpers/html_assertions.js');
var should    = require('chai').should();
var assert    = require('assert');
var proxyquire= require('proxyquire');
var _         = require('lodash');
var expect = require("chai").expect;

var Charge    = proxyquire(__dirname + '/../../app/models/charge.js',{
  '../utils/transaction_view.js': {buildPaymentView: (a,b)=> { return _.merge(a,b); }}
});
var nock      = require('nock');
var wrongPromise = function(data){
  throw new Error('Promise was unexpectedly fulfilled.');
};


describe('charge model', function() {
  describe('findWithEvents', function(){

    describe('when connector is unavailable', function () {
      before(function() {
        nock.cleanAll();
      });

      after(function() {
        nock.cleanAll();
      });

      it('should return client unavailable', function () {
        var chargeModel = Charge("correlation-id");
        return chargeModel.findWithEvents(1,1).then(wrongPromise,
            function rejected(error){
              assert.equal(error,"CLIENT_UNAVAILABLE");
            }
          );
        }
      );
    });

    describe('when connector returns incorrect response code', function () {
      var defaultCorrelationHeader = {
        reqheaders: {'x-request-id': 'some-unique-id'}
      };

      before(function() {
        nock.cleanAll();

        nock(process.env.CONNECTOR_URL, defaultCorrelationHeader)
          .get("/v1/api/accounts/1/charges/2")
          .reply(405, '');

      });

      it('should return get_failed', function () {
        var chargeModel = Charge("some-unique-id");
        return chargeModel.findWithEvents(1,2).then(wrongPromise,
          function rejected(error){
            assert.equal(error,"GET_FAILED");
          });
        });
      });

    describe('when connector returns correctly', function () {
      before(function() {
        nock.cleanAll();

        nock(process.env.CONNECTOR_URL)
          .get("/v1/api/accounts/1/charges/2")
          .reply(200, { foo: "bar" });

        nock(process.env.CONNECTOR_URL)
          .get("/v1/api/accounts/1/charges/2/events")
          .reply(200, { hello: "world" });


      });

      it('should return the correct promise', function () {
        var chargeModel = Charge("correlation-id");
        return chargeModel.findWithEvents(1,2).then(function(data){
          expect(data).to.deep.equal({ foo: 'bar', hello: 'world' });
        },wrongPromise);
      });
    });
  });
});
