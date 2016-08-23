var dbMock      = require(__dirname + '/../test_helpers/db_mock.js');
var request     = require('supertest');
var portfinder  = require('portfinder');
var nock        = require('nock');
var app         = require(__dirname + '/../../server.js').getApp;
var winston     = require('winston');
var paths       = require(__dirname + '/../../app/paths.js');
var session     = require(__dirname + '/../test_helpers/mock_session.js');
var _           = require('lodash');


describe('static controller', function () {
  before(function () {
        // Disable logging.
        winston.level = 'none';
      });

  _.each(['get','post','delete','put','patch'],function(verb){
    it('should return an error page', function (done) {
      request(app)
      [verb]("/request-denied")
      .set('Accept', 'application/json')
      .expect(400)
      .end(done);
    });
  });
});
