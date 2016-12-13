var _ = require('lodash');
var sinon  = require('sinon');
var loginController = require(__dirname + '/../../../app/controllers/login_controller.js');
var sessionUtil = require(__dirname + '/../../../app/utils/session.js');

var assert = require('assert');
var req, res, destroy, redirect;

describe('Log out', function () {
  beforeEach(function () {
    req = {session: { destroy: () => {}}};
    res = {redirect: () => {} };

    destroy = sinon.spy(req.session, 'destroy');
    redirect = sinon.spy(res, 'redirect');
  });

  afterEach(function () {
    destroy.restore();
    redirect.restore();
  });

  it('should clear the session', function () {
    loginController.logOut(req, res);

    assert(destroy.calledOnce);
    assert(redirect.calledWith('/login'));
  });

  it('should handle no session gracefully', function () {
    req = {};

    loginController.logOut(req, res);
    assert(redirect.calledWith('/login'));
  });
});
