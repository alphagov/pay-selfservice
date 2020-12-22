'use strict'

const chai = require('chai')
const nock = require('nock')
const _ = require('lodash')
const connectorMock = nock(process.env.CONNECTOR_URL)
const ACCOUNTS_FRONTEND_PATH = '/v1/frontend/accounts'
const serviceSwitchController = require('../../../app/controllers/my-services')
const User = require('../../../app/models/User.class')
const userFixtures = require('../../fixtures/user.fixtures')
const gatewayAccountFixtures = require('../../fixtures/gateway-account.fixtures')
const chaiAsPromised = require('chai-as-promised')
const { expect } = require('chai')
chai.use(chaiAsPromised)

describe('service switch controller: list of accounts', function () {
  beforeEach(() => {
    nock.cleanAll()
  })

  it('should render a list of services when user has multiple services', function (done) {
    const service1gatewayAccountIds = ['2', '5']
    const service2gatewayAccountIds = ['3', '6', '7']
    const service3gatewayAccountIds = ['4', '9']
    const allServiceGatewayAccountIds = service1gatewayAccountIds.concat(service2gatewayAccountIds).concat(service3gatewayAccountIds)
    const directDebitGatewayAccountIds = ['DIRECT_DEBIT:6bugfqvub0isp3rqfknck5vq24', 'DIRECT_DEBIT:ksdfhjhfd;sfksd34']

    connectorMock.get(ACCOUNTS_FRONTEND_PATH + `?accountIds=${allServiceGatewayAccountIds.join(',')}`)
      .reply(200, {
        accounts: allServiceGatewayAccountIds.map(iter => gatewayAccountFixtures.validGatewayAccountResponse({
          gateway_account_id: iter,
          service_name: `account ${iter}`,
          type: _.sample(['test', 'live'])
        }).getPlain())
      })

    const req = {
      correlationId: 'correlationId',
      user: new User(userFixtures.validUserResponse({
        username: 'bob',
        service_roles: [
          {
            service: {
              id: 201,
              name: 'My Service 1',
              external_id: 'service-external-id-1',
              gateway_account_ids: service1gatewayAccountIds
            },
            role: {
              name: 'admin',
              permissions: [{ name: 'blah-blah:blah' }]
            }
          },
          {
            service: {
              id: 120,
              name: 'My Service 2',
              external_id: 'service-external-id-2',
              gateway_account_ids: service2gatewayAccountIds
            },
            role: {
              name: 'admin',
              permissions: [{ name: 'blah-blah:blah' }]
            }
          },
          {
            service: {
              id: 12,
              name: 'System Generated',
              external_id: 'service-external-id-3',
              gateway_account_ids: service3gatewayAccountIds
            },
            role: {
              name: 'admin',
              permissions: [{ name: 'blah-blah:blah' }]
            }
          },
          {
            service: {
              id: 3,
              name: 'Direct Debit service',
              external_id: 'service-external-id-4',
              gateway_account_ids: directDebitGatewayAccountIds
            },
            role: {
              name: 'admin',
              permissions: [{ name: 'blah-blah:blah' }]
            }
          }]
      })),
      session: {}
    }

    const res = {
      render: function () {
        const path = arguments[0]
        const renderData = arguments[1]

        expect(path).to.equal('services/index')
        const renderedServiceNames = renderData.services.map(service => service.name)
        expect(renderedServiceNames).to.have.lengthOf(4).and.to.have.ordered.members(['Direct Debit service', 'Temporary Service Name', 'My Service 2', 'My Service 1'])
        expect(cardGatewayAccountNamesOf(renderData, 'service-external-id-1')).to.have.lengthOf(2).and.to.include('account 2', 'account 5')
        expect(cardGatewayAccountNamesOf(renderData, 'service-external-id-2')).to.have.lengthOf(3).and.to.include('account 3', 'account 6', 'account 7')
        expect(cardGatewayAccountNamesOf(renderData, 'service-external-id-3')).to.have.lengthOf(2).and.to.include('account 4', 'account 9')
        done()
      }
    }

    const cardGatewayAccountNamesOf = (renderData, serviceExternalId) => renderData.services.filter(s => s.external_id === serviceExternalId)[0].gateway_accounts.cardAccounts.map(g => g.service_name)

    serviceSwitchController.getIndex(req, res)
  })

  it('should render page with no data even if user does not belong to any service', function (done) {
    connectorMock.get(ACCOUNTS_FRONTEND_PATH + `?accountIds=`)
      .reply(200, { accounts: [] })

    const req = {
      user: new User(userFixtures.validUserResponse({
        username: 'bob',
        service_roles: []
      })),
      session: {}
    }

    const res = {
      render: function () {
        const path = arguments[0]
        const renderData = arguments[1]
        expect(path).to.equal('services/index')
        expect(renderData.services).to.have.lengthOf(0)
        done()
      }
    }

    serviceSwitchController.getIndex(req, res)
  })
})

describe('service switch controller: switching', function () {
  it('should redirect to / with correct account id set', function () {
    const session = {}
    const gatewayAccount = {}

    const req = {
      originalUrl: 'http://bob.com?accountId=6',
      user: new User(userFixtures.validUserResponse({
        username: 'bob',
        service_roles: [{
          service: {
            gateway_account_ids: ['6', '5']
          }
        }]
      })),
      session: session,
      gateway_account: gatewayAccount,
      body: {
        gatewayAccountId: '6'
      }
    }

    const res = {
      redirect: function () {
        expect(gatewayAccount.currentGatewayAccountId).to.be.equal('6')
        expect(arguments[0]).to.equal(302)
        expect(arguments[1]).to.equal('/')
      }
    }

    serviceSwitchController.postIndex(req, res)
  })

  it('should not switch id if user not authorised to see account id', function () {
    const session = {}

    const req = {
      originalUrl: 'http://bob.com?accountId=6',
      user: new User(userFixtures.validUserResponse({
        username: 'bob',
        gateway_account_ids: ['8', '666']
      })),
      session: session
    }

    const res = {
      redirect: function () {
        expect(session).to.deep.equal({})
        expect(arguments[0]).to.equal(302)
        expect(arguments[1]).to.equal('/my-services')
      }
    }

    serviceSwitchController.postIndex(req, res)
  })
})

describe('service switch controller: display added to the new service msg', function () {
  beforeEach(() => {
    nock.cleanAll()
  })

  it('should render a list of services when user has multiple services and display added to new service message', function (done) {
    const service1gatewayAccountIds = ['2', '5']
    const newServiceGatewayAccountIds = ['3', '6', '7']
    const gatewayAccountIds = _.concat(service1gatewayAccountIds, newServiceGatewayAccountIds)

    connectorMock.get(ACCOUNTS_FRONTEND_PATH + `?accountIds=${gatewayAccountIds.join(',')}`)
      .reply(200, {
        accounts: gatewayAccountIds.map(iter => gatewayAccountFixtures.validGatewayAccountResponse({
          gateway_account_id: iter,
          service_name: `account ${iter}`,
          type: _.sample(['test', 'live'])
        }).getPlain())
      })

    const newServiceName = 'My New Service'
    const newServiceExternalId = 'service-external-id-2'

    const req = {
      correlationId: 'correlationId',
      user: new User(userFixtures.validUserResponse({
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
              permissions: [{ name: 'blah-blah:blah' }]
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
              permissions: [{ name: 'blah-blah:blah' }]
            }
          }]
      })),
      session: {},
      query: {
        s: newServiceExternalId
      }
    }

    const res = {
      render: function () {
        const path = arguments[0]
        const renderData = arguments[1]
        expect(path).to.equal('services/index')
        expect(renderData.new_service_name).to.be.equal(newServiceName)
        done()
      }
    }

    serviceSwitchController.getIndex(req, res)
  })
})
