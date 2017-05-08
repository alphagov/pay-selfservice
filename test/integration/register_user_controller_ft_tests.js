let nock = require('nock');
let supertest = require('supertest');
let paths = require(__dirname + '/../../app/paths.js');
let getApp = require(__dirname + '/../../server.js').getApp;
let session = require(__dirname + '/../test_helpers/mock_session.js');
let inviteFixtures = require(__dirname + '/../fixtures/invite_fixtures');

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

let app;
let adminusersMock = nock(process.env.ADMINUSERS_URL);
let INVITE_RESOURCE_PATH = '/v1/api/invites';
const expect = chai.expect;
let mockRegisterAccountCookie;

describe('register user controller', function () {

  afterEach((done) => {
    nock.cleanAll();
    app = null;
    done();
  });

  beforeEach((done) => {
    mockRegisterAccountCookie = {};
    app = session.getAppWithRegisterInvitesCookie(getApp(), mockRegisterAccountCookie);
    done();
  });

  it('should redirect to register view on a valid invite code', function (done) {

    let code = '23rer87t8shjkaf';
    let validInviteResponse = inviteFixtures.validInviteResponse().getPlain();

    adminusersMock.get(`${INVITE_RESOURCE_PATH}/${code}`)
      .reply(200, validInviteResponse);

    return supertest(app)
      .get(`/invites/${code}`)
      .set('x-request-id', 'bob')
      .expect(302)
      .expect('Location', paths.register.index)
      .expect(() => {
        expect(mockRegisterAccountCookie.code).to.equal(code);
        expect(mockRegisterAccountCookie.email).to.equal(validInviteResponse.email);
      })
      .end(done);

  });

  it('should redirect to register with telephone number, if user did not complete previous attempt after entering registration details', function (done) {

    let code = '7s8ftgw76rwgu';
    let telephoneNumber = '123456789';
    let validInviteResponse = inviteFixtures.validInviteResponse({telephone_number: telephoneNumber}).getPlain();

    adminusersMock.get(`${INVITE_RESOURCE_PATH}/${code}`)
      .reply(200, validInviteResponse);

    return supertest(app)
      .get(`/invites/${code}`)
      .set('x-request-id', 'bob')
      .expect(302)
      .expect('Location', paths.register.index)
      .expect(() => {
        expect(mockRegisterAccountCookie.code).to.equal(code);
        expect(mockRegisterAccountCookie.email).to.equal(validInviteResponse.email);
        expect(mockRegisterAccountCookie.telephone_number).to.equal(telephoneNumber);
      })
      .end(done);

  });

  it('should error if the invite code is invalid', function (done) {

    let invalidCode = 'invalidCode';
    adminusersMock.get(`${INVITE_RESOURCE_PATH}/${invalidCode}`)
      .reply(404);

    return supertest(app)
      .get(`/invites/${invalidCode}`)
      .set('Accept', 'application/json')
      .set('x-request-id', 'bob')
      .expect(200)
      .expect((res) => {
        expect(res.body.message).to.equal('Unable to process registration');
      })
      .end(done);

  });

});
