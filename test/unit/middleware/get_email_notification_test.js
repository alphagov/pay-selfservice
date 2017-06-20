const should = require('chai').should();
const assert = require('assert');
const sinon = require('sinon');
const _ = require('lodash');
const nock = require('nock');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const retrieveEmailNotification = require(__dirname + '/../../../app/middleware/get_email_notification.js');
const paths = require(__dirname + '/../../../app/paths.js');

let expect = chai.expect;

chai.use(chaiAsPromised);

describe('retrieve email notification template', function () {

  let response = {
      status: () => {},
      render: () => {},
      setHeader: () => {}
    },
    render = undefined,
    next = undefined;

  beforeEach(function () {
    render = sinon.stub(response, "render");
    next = sinon.spy();
    nock.cleanAll();
  });

  afterEach(function () {
    render.restore();
  });

  it('should call the error view if connector call fails', function (done) {

    let req = {account: {gateway_account_id: 1}, headers: {}};
    retrieveEmailNotification(req, response, next);
    setTimeout(function () {
      expect(next.notCalled).to.be.true;
      assert(render.calledWith("error", {message: 'There is a problem with the payments platform'}));
      done();
    }, 100);
  });

  it("should merge account with email notification template data and call next on success", function (done) {

    nock(process.env.CONNECTOR_URL)
      .get("/v1/api/accounts/1/email-notification")
      .reply(200, {template_body: 'hello', enabled: true});

    let req = {account: {gateway_account_id: 1}, headers: {}};

    retrieveEmailNotification(req, response, next).should.be.fulfilled.then(function () {
      expect(req.account).to.deep.equal({
        customEmailText: "hello",
        "gateway_account_id": 1,
        "emailEnabled": true
      });
      expect(next.called).to.be.true;
    }).should.notify(done);
  });
});
