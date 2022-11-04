'use strict'

const chai = require('chai')
const nock = require('nock')
const sinon = require('sinon')
const _ = require('lodash')
const connectorMock = nock(process.env.CONNECTOR_URL)
const ACCOUNTS_FRONTEND_PATH = '/v1/frontend/accounts'
const myServicesController = require('../../../app/controllers/my-services')
const User = require('../../../app/models/User.class')
const userFixtures = require('../../fixtures/user.fixtures')
const gatewayAccountFixtures = require('../../fixtures/gateway-account.fixtures')
const chaiAsPromised = require('chai-as-promised')
const { expect } = require('chai')
chai.use(chaiAsPromised)

describe('My services controller', () => {
  describe('service list', function () {
    const gatewayAccountsByService = {
      service1: [{
        gateway_account_id: '2',
        type: 'test'
      }
      ],
      service2: [
        {
          gateway_account_id: '3',
          type: 'live'
        },
        {
          gateway_account_id: '6',
          type: 'test'
        }
      ],
      service3: [
        {
          gateway_account_id: '4',
          type: 'test'
        },
        {
          gateway_account_id: '9',
          type: 'live'
        }
      ],
      service4: [
        {
          gateway_account_id: '5',
          type: 'test'
        }
      ]
    }
    const user = new User(userFixtures.validUserResponse({
      service_roles: [
        {
          service: {
            id: 201,
            name: 'A service',
            external_id: 'service-external-id-1',
            gateway_account_ids: gatewayAccountsByService.service1.map(account => account.gateway_account_id)
          }
        },
        {
          service: {
            id: 12,
            name: 'C service',
            external_id: 'service-external-id-2',
            gateway_account_ids: gatewayAccountsByService.service2.map(account => account.gateway_account_id)
          }
        },
        {
          service: {
            id: 122,
            name: 'B service',
            external_id: 'service-external-id-3',
            gateway_account_ids: gatewayAccountsByService.service3.map(account => account.gateway_account_id)
          }
        },
        {
          service: {
            id: 120,
            name: 'a service 2',
            external_id: 'service-external-id-4',
            gateway_account_ids: gatewayAccountsByService.service4.map(account => account.gateway_account_id)
          }
        }]
    }))

    const accounts = Object.values(gatewayAccountsByService).flat()
    const accountIds = accounts.map(account => account.gateway_account_id)
    let res

    before(async () => {
      connectorMock.get(ACCOUNTS_FRONTEND_PATH + `?accountIds=${accountIds.join(',')}`)
        .reply(200, gatewayAccountFixtures.validGatewayAccountsResponse({ accounts }))

      res = {
        render: sinon.spy(),
        locals: {}
      }
      const req = {
        user
      }
      await myServicesController.getIndex(req, res)
    })

    after(() => {
      nock.cleanAll()
    })

    it('should call render', () => {
      sinon.assert.called(res.render)
      expect(res.render.firstCall.args[0]).to.equal('services/index')
    })

    it('should return a list sorted by live/test then alphabetically', () => {
      const { services } = res.render.firstCall.args[1]
      expect(services).to.have.length(4)
      expect(services.map(service => service.external_id)).to.have.ordered.members([
        'service-external-id-3', 'service-external-id-2', 'service-external-id-1', 'service-external-id-4'
      ])
    })

    it('should have gateway accounts sorted by type within services', () => {
      it('should have gateway accounts sorted by live/test within services', () => {
        const { services } = res.render.firstCall.args[1]
        expect(services[0].gatewayAccounts.map(a => a.id)).to.have.length(2)
          .and.to.have.ordered.members(['9', '4'])
        expect(services[1].gatewayAccounts.map(a => a.id)).to.have.length(2)
          .and.to.have.ordered.members(['3', '6'])
        expect(services[2].gatewayAccounts.map(a => a.id)).to.have.length(1)
          .and.to.have.ordered.members(['2'])
        expect(services[3].gatewayAccounts.map(a => a.id)).to.have.length(1)
          .and.to.have.ordered.members(['5'])
      })
    })
  })

  describe('switching', function () {
    it('should redirect to / with correct account id set', function () {
      const session = {}
      const gatewayAccountExternalId = 'some-external-id'

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
        body: {
          gatewayAccountId: '6',
          gatewayAccountExternalId
        }
      }

      const res = {
        redirect: function () {
          expect(arguments[0]).to.equal(302)
          expect(arguments[1]).to.equal(`/account/${gatewayAccountExternalId}/dashboard`)
        }
      }

      myServicesController.postIndex(req, res)
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

      myServicesController.postIndex(req, res)
    })
  })

  describe('display added to the new service msg', function () {
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
          }))
        })

      const newServiceName = 'My New Service'
      const newServiceExternalId = 'service-external-id-2'

      const req = {
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
        session: {}
      }

      const res = {
        locals: {
          flash: {
            inviteSuccessServiceId: [newServiceExternalId]
          }
        },
        render: function () {
          const path = arguments[0]
          const renderData = arguments[1]
          expect(path).to.equal('services/index')
          expect(renderData.new_service_name).to.be.equal(newServiceName)
          done()
        }
      }

      myServicesController.getIndex(req, res)
    })
  })
})
