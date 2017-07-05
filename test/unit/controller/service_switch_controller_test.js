const path = require('path')
const sinon = require('sinon')
const chai = require('chai')
const nock = require('nock')

const serviceSwitchController = require(path.join(__dirname, '/../../../app/controllers/service_switch_controller'))
const userFixtures = require(path.join(__dirname, '/../../fixtures/user_fixtures'))
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)

const expect = chai.expect
const connectorMock = nock(process.env.CONNECTOR_URL)
const ACCOUNTS_FRONTEND_PATH = '/v1/frontend/accounts'
let renderSpy = sinon.spy()
let redirectSpy = sinon.spy()

describe('service switch controller: list of accounts', function () {
  beforeEach(() => {
    nock.cleanAll()
  })

  afterEach(() => {
    renderSpy.reset()
  })

  it('should render a list of gateways', function (done) {
    renderSpy = sinon.spy()
    connectorMock.get(ACCOUNTS_FRONTEND_PATH + '/2')
      .reply(200, {
        gateway_account_id: '2',
        description: 'account 2',
        type: 'test',
        payment_provider: 'sandbox'
      })

    connectorMock.get(ACCOUNTS_FRONTEND_PATH + '/5')
      .reply(200, {
        gateway_account_id: '5',
        description: 'account 5',
        type: 'live'
      })

    let req = {
      user: userFixtures.validUserResponse({
        username: 'bob',
        gateway_account_ids: ['2', '5']
      }).getAsObject(),
      session: {}
    }

    let res = {
      render: renderSpy
    }

    serviceSwitchController.index(req, res).should.be.fulfilled.then(() => {
      expect(renderSpy.calledWith('services/index', sinon.match({gatewayAccounts: [
        {
          gateway_account_id: '2',
          description: 'account 2',
          payment_provider: 'sandbox',
          payment_provider_display_name: 'Sandbox',
          type: 'test'
        },
        {
          gateway_account_id: '5',
          description: 'account 5',
          type: 'live'
        }
      ]
      }))).to.be.equal(true)
    }).should.notify(done)
  })

  it('should render remaining list if fetching one of list of gateway accounts fails', function (done) {
    connectorMock.get(ACCOUNTS_FRONTEND_PATH + '/2')
      .reply(200, {
        gateway_account_id: '2',
        description: 'account 2',
        type: 'test'
      })

    connectorMock.get(ACCOUNTS_FRONTEND_PATH + '/5')
      .reply(500, {
        message: 'uh oh'
      })

    let req = {
      user: userFixtures.validUserResponse({
        username: 'bob',
        gateway_account_ids: ['2', '5']
      }).getAsObject(),
      session: {}
    }

    let res = {
      render: renderSpy
    }

    serviceSwitchController.index(req, res).should.be.fulfilled.then(() => {
      expect(renderSpy.calledWith('services/index', sinon.match({gatewayAccounts: [
        {
          gateway_account_id: '2',
          description: 'account 2',
          type: 'test'
        }
      ]
      }))).to.be.equal(true)
    }).should.notify(done)
  })

  it('should show error if no gateway accounts', function () {
    let renderSpy = sinon.spy()
    let setHeaderSpy = sinon.spy()
    let statusSpy = sinon.spy()

    let req = {
      user: userFixtures.validUserResponse({
        username: 'bob',
        gateway_account_ids: []
      }).getAsObject(),
      session: {}
    }

    let res = {
      render: renderSpy,
      setHeader: setHeaderSpy,
      status: statusSpy
    }

    serviceSwitchController.index(req, res)

    expect(renderSpy.calledWith('error', {message: 'No gateway accounts found for user'})).to.be.equal(true)
    expect(setHeaderSpy.calledWith('Content-Type', 'text/html')).to.be.equal(true)
    expect(statusSpy.calledWith(500)).to.be.equal(true)
  })

  it('should render the name of the first returned service', function (done) {
    renderSpy = sinon.spy()
    connectorMock.get(ACCOUNTS_FRONTEND_PATH + '/2')
      .reply(200, {
        gateway_account_id: '2',
        description: 'account 2',
        type: 'test',
        payment_provider: 'sandbox'
      })

    let req = {
      user: userFixtures.validUserResponse({
        username: 'bob',
        services: [{
          id: 1234,
          name: 'Super Example Mega-Service'
        }]
      }).getAsObject(),
      session: {}
    }

    let res = {
      render: renderSpy
    }

    serviceSwitchController.index(req, res).should.be.fulfilled.then(() => {
      expect(renderSpy.calledWith('services/index', sinon.match({
        serviceName: 'Super Example Mega-Service'
      }))).to.be.equal(true)
    }).should.notify(done)
  })

  it('should show error if no services', function () {
    let renderSpy = sinon.spy()
    let setHeaderSpy = sinon.spy()
    let statusSpy = sinon.spy()

    let req = {
      user: userFixtures.validUserResponse({
        username: 'bob',
        services: []
      }).getAsObject(),
      session: {}
    }

    let res = {
      render: renderSpy,
      setHeader: setHeaderSpy,
      status: statusSpy
    }

    serviceSwitchController.index(req, res)

    expect(renderSpy.calledWith('error', {message: 'No services found for user'})).to.be.equal(true)
    expect(setHeaderSpy.calledWith('Content-Type', 'text/html')).to.be.equal(true)
    expect(statusSpy.calledWith(500)).to.be.equal(true)
  })
})

describe('service switch controller: switching', function () {
  afterEach(() => {
    redirectSpy.reset()
  })

  it('should redirect to / with correct account id set', function () {
    redirectSpy = sinon.spy()
    let session = {}
    let gatewayAccount = {}

    let req = {
      originalUrl: 'http://bob.com?accountId=6',
      user: userFixtures.validUserResponse({
        username: 'bob',
        gateway_account_ids: ['6', '5']
      }).getAsObject(),
      session: session,
      gateway_account: gatewayAccount,
      body: {
        gatewayAccountId: '6'
      }
    }

    let res = {
      redirect: redirectSpy
    }

    serviceSwitchController.switch(req, res)

    expect(gatewayAccount.currentGatewayAccountId).to.be.equal('6')
    expect(redirectSpy.calledWith(302, '/')).to.be.equal(true)
  })

  it('should not switch id if user not authorised to see account id', function () {
    let redirectSpy = sinon.spy()
    let session = {}

    let req = {
      originalUrl: 'http://bob.com?accountId=6',
      user: userFixtures.validUserResponse({
        username: 'bob',
        gateway_account_ids: ['8', '666']
      }).getAsObject(),
      session: session
    }

    let res = {
      redirect: redirectSpy
    }

    serviceSwitchController.switch(req, res)

    expect(session).to.deep.equal({})
    expect(redirectSpy.calledWith(302, '/my-services')).to.be.equal(true)
  })
})
