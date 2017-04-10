var chai = require('chai');
var _ = require('lodash');
var nock = require('nock');
var sinon = require('sinon');

var baseClient =  require('../../../../app/services/clients/base_client');

const expect = chai.expect;

describe('base client', function () {
  describe('request headers', function() {
    /**
     * This test and the one below are to check content length
     * header is being set correctly. This is needed specifically because
     * naively setting it to JSON.stringify(payload).length
     * gives wrong answer when payload includes chars that are encoded
     * by 2 bytes in utf-8 (eg. £)
     *
     * The length in this first test is 5 because it is the length of
     * the string obtainer from stringifying the array: ie
     * Buffer.byteLength("['a']") = 5
     *
     * In the case of ['£'] we expect length to be 6 as
     * Buffer.byteLength('£') = 2
     */
    it('should set correct content length for ascii characters', function() {
      let req = baseClient.get('http://www.example.com', {
        payload: ['a']
      }, () => {});

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
    it('should  be called with correct args', function(done) {
      let mockServer = nock('http://localhost:3015');

      mockServer.get('/')
        .reply(200, {
          foo: 'bar'
        });
      baseClient.get('http://localhost:3015', {}, function (err, res, data) {
        expect(data).to.deep.equal({foo: 'bar'});
        done();
      });
    });

    it('should be called with data = null if data is non-JSON', function(done) {
      let mockServer = nock('http://localhost:3015');

      mockServer.get('/')
        .reply(200, 'foo');

      baseClient.get('http://localhost:3015', {}, function (err, res, data) {
        expect(data).to.equal(null);
        done();
      });
    });

    it('should be called with err if there is an err', function(done) {
      let mockServer = nock('http://localhost:3015');
      mockServer.get('/')
        .replyWithError({'message': 'something awful happened', 'code': 'AWFUL_ERROR'});

      baseClient.get('http://localhost:3015', {}, function (err, res, data) {
        expect(err).to.deep.equal({'message': 'something awful happened', 'code': 'AWFUL_ERROR'});
        expect(data).to.equal(undefined);
        expect(res).to.equal(undefined);

        done();
      });
    });
  })
});
