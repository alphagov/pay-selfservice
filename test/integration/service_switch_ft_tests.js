let nock = require('nock');
var proxyquire = require('proxyquire');
var supertest = require('supertest');
var csrf = require('csrf');

var session = require(__dirname + '/../test_helpers/mock_session.js');
var getApp = require(__dirname + '/../../server.js').getApp;

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

var app;

describe('service switch controller', function () {
  afterEach((done) => {
    nock.cleanAll();
    app = null;
    done();
  });

  it('should post request for new account id', function (done) {
    var user = session.getUser({
      gateway_account_ids: ['1','2','5']
    });
    var mockSession = session.getMockSession(user);
    app = session.getAppWithSession(getApp(), mockSession);

    return supertest(app)
      .post('/my-services/switch')
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('x-request-id','bob')
      .send({
        gatewayAccountId: '5',
        csrfToken: csrf().create('123')
      })
      .expect(302)
      .expect(() => {
        expect(mockSession.currentGatewayAccountId).to.equal('5');
      })
      .end(done);
  });
});
