var sinon = require('sinon');
var chai = require('chai');
var nock = require('nock');
var proxyquire = require('proxyquire');

var serviceSwitchController = require(__dirname + '/../../../app/controllers/service_switch_controller');
var userFixtures = require(__dirname + '/../../fixtures/user_fixtures');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const expect = chai.expect;
var connectorMock = nock(process.env.CONNECTOR_URL);
var ACCOUNTS_FRONTEND_PATH = '/v1/frontend/accounts';
var renderSpy = sinon.spy();
var redirectSpy = sinon.spy();


describe('service switch controller: list of accounts', function () {
  beforeEach(() => {
    nock.cleanAll();
  });

  afterEach(() => {
    renderSpy.reset();
  });

  it('should render a list of gateways', function (done) {
    renderSpy = sinon.spy();
    connectorMock.get(ACCOUNTS_FRONTEND_PATH + '/2')
      .reply(200, {
        gateway_account_id: '2',
        description: 'account 2',
        type: 'test'
      });

    connectorMock.get(ACCOUNTS_FRONTEND_PATH + '/5')
      .reply(200, {
        gateway_account_id: '5',
        description: 'account 5',
        type: 'live'
      });

    let req = {
      user: userFixtures.validUserResponse({
        username: 'bob',
        gateway_account_ids: ['2', '5']
      }).getAsObject(),
      session: {}
    };

    let res = {
      render: renderSpy
    };

    serviceSwitchController.index(req, res).should.be.fulfilled.then(() => {
      expect(renderSpy.calledWith('service_switcher/index', sinon.match({gatewayAccounts: [
        {
          gateway_account_id: '2',
          description: 'account 2',
          type: 'test'
        },
        {
          gateway_account_id: '5',
          description: 'account 5',
          type: 'live'
        }
      ]
      }))).to.be.equal(true);
    }).should.notify(done);
  });

  it('should render error if fetching one of list of gateway accounts fails', function (done) {
    let renderSpy = sinon.spy();

    connectorMock.get(ACCOUNTS_FRONTEND_PATH + '/2')
      .reply(200, {
        gateway_account_id: '2',
        description: 'account 2',
        type: 'test'
      });

    connectorMock.get(ACCOUNTS_FRONTEND_PATH + '/5')
      .reply(500, {
        message: 'uh oh'
      });

    let req = {
      user: userFixtures.validUserResponse({
        username: 'bob',
        gateway_account_ids: ['2', '5']
      }).getAsObject(),
      session: {}
    };

    let res = {
      render: renderSpy
    };

    serviceSwitchController.index(req, res).should.be.fulfilled.then(() => {
      expect(renderSpy.calledWith('error', {message: 'Unable to display accounts'})).to.be.equal(true);
    }).should.notify(done);
  });

  it('should show error if no gateway accounts', function () {
    let renderSpy = sinon.spy();

    let req = {
      user: userFixtures.validUserResponse({
        username: 'bob',
        gateway_account_ids: []
      }).getAsObject(),
      session: {}
    };

    let res = {
      render: renderSpy
    };

    serviceSwitchController.index(req, res);

    expect(renderSpy.calledWith('error', { message: 'No accounts found for user'})).to.be.equal(true);
  });
});

describe('service switch controller: switching', function () {
  afterEach(() => {
    redirectSpy.reset();
  });

  it('should redirect to / with correct account id set', function () {
    redirectSpy = sinon.spy();
    let session = {};

    let req = {
      originalUrl: 'http://bob.com?accountId=6',
      user: userFixtures.validUserResponse({
        username: 'bob',
        gateway_account_ids: ['6', '5']
      }).getAsObject(),
      session: session
    };

    let res = {
      redirect: redirectSpy
    };

    serviceSwitchController.switch(req, res);

    expect(session.currentGatewayAccountId).to.be.equal('6');
    expect(redirectSpy.calledWith(302, '/')).to.be.equal(true);
  });

  it('should not switch id  if user not authorised to see account id', function () {
    let redirectSpy = sinon.spy();
    let session = {};

    let req = {
      originalUrl: 'http://bob.com?accountId=6',
      user: userFixtures.validUserResponse({
        username: 'bob',
        gateway_account_ids: ['8', '666']
      }).getAsObject(),
      session: session
    };

    let res = {
      redirect: redirectSpy
    };

    serviceSwitchController.switch(req, res);

    expect(session).to.deep.equal({});
    expect(redirectSpy.calledWith(302, '/my-services')).to.be.equal(true);
  });
});
