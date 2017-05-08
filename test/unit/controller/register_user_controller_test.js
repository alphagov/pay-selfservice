let paths = require('../../../app/paths.js');
let sinon = require('sinon');
let chai = require('chai');
let nock = require('nock');
const expect = chai.expect;
let inviteFixtures = require(__dirname + '/../../fixtures/invite_fixtures');
let registerUserController = require(__dirname + '/../../../app/controllers/register_user_controller');
let adminusersMock = nock(process.env.ADMINUSERS_URL);

let INVITE_RESOURCE_PATH = '/v1/api/invites';


describe('register user controller', function () {

  it('should redirect to register, for a request with valid invitation code', function (done) {

    let code = '7s8ftgw76rwgu';
    let validInviteResponse = inviteFixtures.validInviteResponse().getPlain();

    adminusersMock.get(`${INVITE_RESOURCE_PATH}/${code}`)
      .reply(200, validInviteResponse);

    let req = {
      params: {code: code}
    };

    let redirectSpy = sinon.spy();
    let res = {
      redirect: redirectSpy
    };

    registerUserController.invites(req, res).should.be.fulfilled.then(() => {
      expect(req.register_invite.code).to.be.equal(code);
      expect(req.register_invite.email).to.be.equal(validInviteResponse.email);
      expect(req.register_invite.telephone_number).to.be.equal(undefined);
      expect(redirectSpy.calledWith(302, paths.register.index)).to.be.equal(true);
    }).should.notify(done);

  });


  it('should redirect to register with telephone number, if user did not complete previous attempt after entering registration details', function (done) {

    let code = '7s8ftgw76rwgu';
    let telephoneNumber = '123456789';
    let validInviteResponse = inviteFixtures.validInviteResponse({telephone_number: telephoneNumber}).getPlain();

    adminusersMock.get(`${INVITE_RESOURCE_PATH}/${code}`)
      .reply(200, validInviteResponse);

    let req = {
      params: {code: code}
    };

    let redirectSpy = sinon.spy();
    let res = {
      redirect: redirectSpy
    };

    registerUserController.invites(req, res).should.be.fulfilled.then(() => {
      expect(req.register_invite.code).to.be.equal(code);
      expect(req.register_invite.email).to.be.equal(validInviteResponse.email);
      expect(req.register_invite.telephone_number).to.be.equal(telephoneNumber);
      expect(redirectSpy.calledWith(302, paths.register.index)).to.be.equal(true);
    }).should.notify(done);

  });

  it('should error if the invite code is invalid', function (done) {

    let invalidCode = 'invalid-code';

    let req = {
      params: {code: invalidCode}
    };

    let renderSpy = sinon.spy();
    let res = {
      setHeader: sinon.spy(),
      status: sinon.spy(),
      render: renderSpy
    };

    adminusersMock.get(`${INVITE_RESOURCE_PATH}/${invalidCode}`)
      .reply(404);

    registerUserController.invites(req, res).should.be.fulfilled.then(() => {
      expect(renderSpy.calledWith('error', {message: 'Unable to process registration'})).to.be.equal(true);
    }).should.notify(done);
  });
});
