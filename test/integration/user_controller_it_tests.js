var request = require('supertest');
var _app = require(__dirname + '/../../server.js').getApp;
var assert = require('assert');
var cheerio = require('cheerio');
var should = require('chai').should();
var user = require(__dirname + '/../../app/models/user.js');
var sinon = require('sinon');

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

  it('should call User model create with normalised req.user on create', function (done) {

    var data = {
      username: 'Peter Pan',
      email: 'peter@pan.com',
      telephone_number: '1234567890',
      password: 'peterpan66',
      gateway_account_id: '1',
      fakeField: 'This field should not be in the normalised request body'
    };

    sinon.stub(user, 'create')
      .returns({
        then: function (thenFn) {
          thenFn();
        }
      });

    request(_app)
      .post("/users/create")
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(data)
      .expect(302)
      .expect(function (res) {
        res.headers.location.should.equal('/users');
        assert(user.create.calledWithMatch({
          username: 'Peter Pan',
          email: 'peter@pan.com',
          telephone_number: '1234567890',
          password: 'peterpan66',
          gateway_account_id: '1'
        }));
        user.create.restore();
      })
      .end(done);
  });

  it('should open list of users page', function (done) {

    sinon.stub(user, 'findAll')
      .returns({
        then: function (thenFn) {
          thenFn([{
            username: 'User 1',
            email: 'user1@example.com',
            telephone_number: '1234567890',
            gateway_account_id: '1'
          },
            {
              username: 'User 2',
              email: 'user2@example.com',
              telephone_number: '1234567890',
              gateway_account_id: '1'
            }]);
        }
      });

    request(_app)
      .get("/users")
      .expect(200)
      .expect(function (res) {
        user.findAll.restore();
        var $ = cheerio.load(res.text);
        $('title').text().should.contains('GOV.UK Pay - View users');
        res.text.should.containSelector('tr[data-email=\"user1@example.com\"]');
        res.text.should.containSelector('tr[data-email=\"user2@example.com\"]');
      })
      .end(done);
  });

  it('should show manage a user page with expected actions', function (done) {

    sinon.stub(user, 'findById')
      .returns({
        then: function (thenFn) {
          thenFn({
            id: 1,
            username: 'User 1',
            email: 'user1@example.com',
            telephone_number: '1234567890',
            gateway_account_id: '1'
          });
        }
      });

    request(_app)
      .get("/users/1")
      .expect(200)
      .expect(function (res) {
        assert(user.findById.calledWithMatch(1));
        user.findById.restore();
        var $ = cheerio.load(res.text);
        $('h2.heading-small').text().should.equals('User Details');
        $('#user-email').text().should.equals('user1@example.com');
        res.text.should.containSelector('form[action=\"/users/1/disable\"]');
        res.text.should.containSelector('form[action=\"/users/1/reset\"]');
      })
      .end(done);
  });

  it('should redirect to show user when send password reset', function (done) {

    var correlationId = "correlationId";

    sinon.stub(user, 'findById')
      .returns({
        then: function (thenFn) {
          thenFn({
            id: 1,
            username: 'User 1',
            email: 'user1@example.com',
            telephone_number: '1234567890',
            gateway_account_id: '1',
            sendPasswordResetToken: function (correlationId) {
              assert.equal(correlationId, "correlationId");
              return {
                then: function (thenFn) {
                  thenFn();
                }
              }
            }
          });
        }
      });

    request(_app)
      .post("/users/1/reset")
      .set("X-Request-Id", correlationId)
      .expect(302)
      .expect(function (res) {
        res.headers.location.should.equal('/users/1');
        assert(user.findById.calledWithMatch(1));
        user.findById.restore();
      })
      .end(done);
  });

  it('should toggle user disable and redirect to show user', function (done) {

    var correlationId = "correlationId";

    sinon.stub(user, 'findById')
      .returns({
        then: function (thenFn) {
          thenFn({
            id: 1,
            username: 'User 1',
            email: 'user1@example.com',
            telephone_number: '1234567890',
            gateway_account_id: '1',
            toggleDisabled: function (toggle) {
              assert.equal(toggle, true);
            }
          });
        }
      });

    request(_app)
      .post("/users/1/disable")
      .expect(302)
      .expect(function (res) {
        res.headers.location.should.equal('/users/1');
        assert(user.findById.calledWithMatch(1));
        user.findById.restore();
      })
      .end(done);
  });

  it('should toggle user enable and redirect to show user', function (done) {

    var correlationId = "correlationId";

    sinon.stub(user, 'findById')
      .returns({
        then: function (thenFn) {
          thenFn({
            id: 1,
            username: 'User 1',
            email: 'user1@example.com',
            telephone_number: '1234567890',
            gateway_account_id: '1',
            toggleDisabled: function (toggle) {
              assert.equal(toggle, false);
            }
          });
        }
      });

    request(_app)
      .post("/users/1/enable")
      .expect(302)
      .expect(function (res) {
        res.headers.location.should.equal('/users/1');
        assert(user.findById.calledWithMatch(1));
        user.findById.restore();
      })
      .end(done);
  });

});
