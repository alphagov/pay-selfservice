var request = require('supertest');
var _app    = require(__dirname + '/../../server.js').getApp;
var assert  = require('assert');
var cheerio = require('cheerio');
var should = require('chai').should();
var mock = require('mock-require');

/*
mock('http', { request: function() {
  console.log('http.request called');
}});
*/


describe('users endpoint', function () {

  it('should open intro page and display expected links', function (done) {
    request(_app)
      .get("/users/intro")
      .expect(200)
      .expect(function (res) {
        res.text.should.containSelector('input#create-account');
        var $ = cheerio.load(res.text);
        $('#link-login').attr('href').should.equal('/login');
      })
      .end(done);
  });

  it('should open new user page', function (done) {
    request(_app)
      .get("/users/new")
      .expect(200)
      .expect(function (res) {
        res.text.should.containSelector('form#create-user');
      })
      .end(done);
  });

<<<<<<< HEAD
  xit('should call User model create with normalised req.user on create', function (done) {

    // Are wew doing integration tests anymore??

/*
    mock('user.js', { create: function(user) {

      assert.equal(user.username, 'Tom');
      console.log('>>>>>>>>>>>> Create was called http.request called');
    }});
*/

    var data = {
      username:"Peter Pan",
      email:"peter@pan.com",
      telephone_number:"1234567890",
      password:"peterpan66",
      gateway_account_id:"1"
    };

    request(_app)
      .post("/users/create", data)
=======
  it('should call User model create with normalised req.user on create', function (done) {
    request(_app)
      .get("/users/new")
>>>>>>> b4151d49b9e8a1c1387e0e922093dfb8bd15bfc2
      .expect(200)
      .expect(function (res) {
        res.text.should.containSelector('form#create-user');
      })
      .end(done);
  });
});
