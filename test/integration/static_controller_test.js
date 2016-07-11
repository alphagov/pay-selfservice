var request     = require('supertest');
var portfinder  = require('portfinder');
var nock        = require('nock');
var app         = require(__dirname + '/../../server.js').getApp;
var winston     = require('winston');
var paths       = require(__dirname + '/../../app/paths.js');
var session     = require(__dirname + '/../test_helpers/mock_session.js');



describe('static controller', function () {
  before(function () {
        // Disable logging.
        winston.level = 'none';
      });


  it('should return an error page', function (done) {
    request(app)
    .get("/request-denied")
    .set('Accept', 'application/json')
    .expect(400)
    .end(done);

  });
});
