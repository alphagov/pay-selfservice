require(__dirname + '/../test_helpers/serialize_mock.js');
var request     = require('supertest');
var getApp      = require(__dirname + '/../../server.js').getApp;
var _           = require('lodash');

describe('static controller', function () {
  _.each(['get','post','delete','put','patch'],function(verb){
    it('should return an error page', function (done) {
      request(getApp())
      [verb]("/request-denied")
      .set('Accept', 'application/json')
      .expect(400)
      .end(done);
    });
  });
});



