var chai = require('chai');
var _ = require('lodash');
var nock = require('nock');
var sinon = require('sinon');

var baseClient =  require('../../../../app/services/clients/base_client');

const expect = chai.expect;

describe.only('base client', function () {
  describe('request headers', function() {
    it('should set correct content length for ascii characters', function() {
      let req = baseClient.get('http://www.example.com', {
        payload: ['a']
      }, () => {});

      console.log(req);
      expect(req._headers['content-length']).to.equal(5);
    });

    it('should set correct content length for non-ascii characters', function() {
      let req = baseClient.get('http://www.example.com', {
        payload: ['£']
      }, () => {});

      expect(req._headers['content-length']).to.equal(6);
    });

    it('should not set content length if no payload', function() {
      let req = baseClient.get('http://www.example.com', {}, () => {});

      expect(req._headers['content-length']).to.equal(undefined);
    });
  });


  describe('callback', function() {
    it('should call callback', function(done) {
      let mockServer = nock('http://localhost:3015');

      mockServer.get('/')
        .reply(200, {
          foo: 'bar'
        });
      let req = baseClient.get('http://localhost:3015', {}, function (err, res, data) {
        expect(data).to.deep.equal({foo: 'bar'});
        done();
      });
    });

    it('should call callback with data = null if data is non-JSON', function(done) {
      let mockServer = nock('http://localhost:3015');

      mockServer.get('/')
        .reply(200, 'foo');

      baseClient.get('http://localhost:3015', {}, function (err, res, data) {
        expect(data).to.equal(null);
        done();
      });
    });

    it('should call callback with err if theres an err', function(done) {
      let mockServer = nock('http://localhost:3015');
      mockServer.get('/')
        .replyWithError({'message': 'something awful happened', 'code': 'AWFUL_ERROR'});

      baseClient.get('http://localhost:3015', {}, function (err, res, data) {
        console.log(err);
        expect(err).to.deep.equal({'message': 'something awful happened', 'code': 'AWFUL_ERROR'});
        expect(data).to.equal(undefined);
        expect(res).to.equal(undefined);

        done();
      });
    });
  })
});
