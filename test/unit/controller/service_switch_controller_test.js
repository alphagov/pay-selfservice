'use strict'

const expect = chai.expect;
const connectorMock = nock(process.env.CONNECTOR_URL);
const ACCOUNTS_FRONTEND_PATH = '/v1/frontend/accounts';
const serviceSwitchController = require('../../../app/controllers/my_services_controller')
const userFixtures = require('../../fixtures/user_fixtures')
const gatewayAccountFixtures = require('../../fixtures/gateway_account_fixtures')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)

const expect = chai.expect
const connectorMock = nock(process.env.CONNECTOR_URL)
const ACCOUNTS_FRONTEND_PATH = '/v1/frontend/accounts'

const renderSpy = sinon.spy()
const redirectSpy = sinon.spy()

describe('service switch controller: list of accounts', function () {
  beforeEach(() => {
    nock.cleanAll()
  })

  afterEach(() => {
    renderSpy.reset()
  })

  it('should render a list of services when user has multiple services', function (done) {
    const service1gatewayAccountIds = ['2', '5']
    const service2gatewayAccountIds = ['3', '6', '7']
    const service3gatewayAccountIds = ['4', '9']
    const gatewayAccountIds = _.concat(service1gatewayAccountIds, service2gatewayAccountIds, service3gatewayAccountIds)

    gatewayAccountIds.forEach(gid => {
      connectorMock.get(ACCOUNTS_FRONTEND_PATH + `/${gid}`)
        .reply(200, gatewayAccountFixtures.validGatewayAccountResponse({
          gateway_account_id: gid,
          service_name: `account ${gid}`,
          type: _.sample(['test', 'live'])
        }).getPlain())
    })

    const req = {
      correlationId: 'correlationId',
      user: userFixtures.validUserResponse({
        username: 'bob',
        service_roles: [
          {
            service: {
              name: 'My Service 1',
              external_id: 'service-external-id-1',
              gateway_account_ids: service1gatewayAccountIds
            },
            role: {
              name: 'admin',
              permissions: [{name: 'blah-blah:blah'}]
            }
          },
          {
            service: {
              name: 'My Service 2',
              external_id: 'service-external-id-2',
              gateway_account_ids: service2gatewayAccountIds
            },
            role: {
              name: 'admin',
              permissions: [{name: 'blah-blah:blah'}]
            }
          },
          {
            service: {
              name: 'System Generated',
              external_id: 'service-external-id-3',
              gateway_account_ids: service3gatewayAccountIds
            },
            role: {
              name: 'admin',
              permissions: [{name: 'blah-blah:blah'}]
            }
          }]
      }).getAsObject(),
      session: {}
    }

    const res = {
      render: renderSpy
    }

    const gatewayAccountNamesOf = (renderData, serviceExternalId) => renderData.services.filter(s => s.external_id === serviceExternalId)[0].gateway_accounts.map(g => g.service_name)

    serviceSwitchController.index(req, res).should.be.fulfilled.then(() => {
      expect(renderSpy.calledOnce).to.be.equal(true)

      const path = renderSpy.getCall(0).args[0]
      const renderData = renderSpy.getCall(0).args[1]

      expect(path).to.equal('services/index')
      expect(renderData.navigation).to.equal(false)

      expect(renderData.services.map(service => service.name)).to.have.lengthOf(3).and.to.include('My Service 1', 'My Service 2', '')

      expect(gatewayAccountNamesOf(renderData, 'service-external-id-1')).to.have.lengthOf(2).and.to.include('account 2', 'account 5')
      expect(gatewayAccountNamesOf(renderData, 'service-external-id-2')).to.have.lengthOf(3).and.to.include('account 3', 'account 6', 'account 7')
      expect(gatewayAccountNamesOf(renderData, 'service-external-id-3')).to.have.lengthOf(2).and.to.include('account 4', 'account 9')
    }).should.notify(done)
  })

  it('should render page with no data even if user does not belong to any service', function (done) {
    const setHeaderSpy = sinon.spy()
    const statusSpy = sinon.spy()

    const req = {
      user: userFixtures.validUserResponse({
        username: 'bob',
        service_roles: []
      }).getAsObject(),
      session: {}
    }

    const res = {
      render: renderSpy,
      setHeader: setHeaderSpy,
      status: statusSpy
    }

    serviceSwitchController.index(req, res).should.be.fulfilled.then(() => {
      expect(renderSpy.calledOnce).to.be.equal(true)

      const path = renderSpy.getCall(0).args[0]
      const renderData = renderSpy.getCall(0).args[1]
      expect(path).to.equal('services/index')

      expect(renderData.navigation).to.equal(false)
      expect(renderData.services).to.have.lengthOf(0)
    }).should.notify(done)
  })
})

describe('service switch controller: switching', function () {
  afterEach(() => {
    redirectSpy.reset()
  })

  it('should redirect to / with correct account id set', function () {
    const session = {}
    const gatewayAccount = {}

    const req = {
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

    const res = {
      redirect: redirectSpy
    }

    serviceSwitchController.switch(req, res)

    expect(gatewayAccount.currentGatewayAccountId).to.be.equal('6')
    expect(redirectSpy.calledWith(302, '/')).to.be.equal(true)
  })

  it('should not switch id if user not authorised to see account id', function () {
    const session = {}

    const req = {
      originalUrl: 'http://bob.com?accountId=6',
      user: userFixtures.validUserResponse({
        username: 'bob',
        gateway_account_ids: ['8', '666']
      }).getAsObject(),
      session: session
    }

    const res = {
      redirect: redirectSpy
    }

    serviceSwitchController.switch(req, res)

    expect(session).to.deep.equal({})
    expect(redirectSpy.calledWith(302, '/my-services')).to.be.equal(true)
  })
})

describe('service switch controller: display added to the new service msg', function () {
  beforeEach(() => {
    nock.cleanAll()
  })

  afterEach(() => {
    renderSpy.reset()
  })

  it('should render a list of services when user has multiple services and display added to new service message', function (done) {
    const service1gatewayAccountIds = ['2', '5']
    const newServiceGatewayAccountIds = ['3', '6', '7']
    const gatewayAccountIds = _.concat(service1gatewayAccountIds, newServiceGatewayAccountIds)

    gatewayAccountIds.forEach(gid => {
      connectorMock.get(ACCOUNTS_FRONTEND_PATH + `/${gid}`)
        .reply(200, gatewayAccountFixtures.validGatewayAccountResponse({
          gateway_account_id: gid,
          service_name: `account ${gid}`,
          type: _.sample(['test', 'live'])
        }).getPlain())
    })

    const newServiceName = 'My New Service'
    const newServiceExternalId = 'service-external-id-2'

    const req = {
      correlationId: 'correlationId',
      user: userFixtures.validUserResponse({
        username: 'bob',
        service_roles: [
          {
            service: {
              name: 'My Service 1',
              external_id: 'service-external-id-1',
              gateway_account_ids: service1gatewayAccountIds
            },
            role: {
              name: 'admin',
              permissions: [{name: 'blah-blah:blah'}]
            }
          },
          {
            service: {
              name: newServiceName,
              external_id: newServiceExternalId,
              gateway_account_ids: newServiceGatewayAccountIds
            },
            role: {
              name: 'admin',
              permissions: [{name: 'blah-blah:blah'}]
            }
          }]
      }).getAsObject(),
      session: {},
      query: {
        s: newServiceExternalId
      }
    }

    const res = {
      render: renderSpy
    }

    serviceSwitchController.index(req, res).should.be.fulfilled.then(() => {
      expect(renderSpy.calledOnce).to.be.equal(true)

      const path = renderSpy.getCall(0).args[0]
      const renderData = renderSpy.getCall(0).args[1]

      expect(path).to.equal('services/index')
      expect(renderData.navigation).to.equal(false)

      expect(renderData.new_service_name).to.be.equal(newServiceName)
    }).should.notify(done)
  })
})
