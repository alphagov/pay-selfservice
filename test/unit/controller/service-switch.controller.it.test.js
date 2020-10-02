'use strict'

const nock = require('nock')
const _ = require('lodash')
const connectorMock = nock(process.env.CONNECTOR_URL)
const directDebitConnectorMock = nock(process.env.DIRECT_DEBIT_CONNECTOR_URL)
const ACCOUNTS_FRONTEND_PATH = '/v1/frontend/accounts'
const DIRECT_DEBIT_ACCOUNTS_PATH = '/v1/api/accounts'
const serviceSwitchController = require('../../../app/controllers/my-services')
const userFixtures = require('../../fixtures/user.fixtures')
const gatewayAccountFixtures = require('../../fixtures/gateway-account.fixtures')

describe('service switch controller: list of accounts', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  it(
    'should render a list of services when user has multiple services',
    done => {
      const service1gatewayAccountIds = ['2', '5']
      const service2gatewayAccountIds = ['3', '6', '7']
      const service3gatewayAccountIds = ['4', '9']
      const allServiceGatewayAccountIds = service1gatewayAccountIds.concat(service2gatewayAccountIds).concat(service3gatewayAccountIds)
      const directDebitGatewayAccountIds = ['DIRECT_DEBIT:6bugfqvub0isp3rqfknck5vq24', 'DIRECT_DEBIT:ksdfhjhfd;sfksd34']

      connectorMock.get(ACCOUNTS_FRONTEND_PATH + `?accountIds=${allServiceGatewayAccountIds.join(',')}`)
        .reply(200, { accounts: allServiceGatewayAccountIds.map(iter => gatewayAccountFixtures.validGatewayAccountResponse({
          gateway_account_id: iter,
          service_name: `account ${iter}`,
          type: _.sample(['test', 'live'])
        }).getPlain()) })

      directDebitConnectorMock.get(DIRECT_DEBIT_ACCOUNTS_PATH + `?externalAccountIds=${directDebitGatewayAccountIds.join(',')}`)
        .reply(200, { accounts: directDebitGatewayAccountIds.map(iter => gatewayAccountFixtures.validDirectDebitGatewayAccountResponse({
          gateway_account_id: iter,
          type: _.sample(['test', 'live'])
        }).getPlain()) })

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
                permissions: [{ name: 'blah-blah:blah' }]
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
                permissions: [{ name: 'blah-blah:blah' }]
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
                permissions: [{ name: 'blah-blah:blah' }]
              }
            },
            {
              service: {
                name: 'Direct Debit service',
                external_id: 'service-external-id-4',
                gateway_account_ids: directDebitGatewayAccountIds
              },
              role: {
                name: 'admin',
                permissions: [{ name: 'blah-blah:blah' }]
              }
            }]
        }).getAsObject(),
        session: {}
      }

      const res = {
        render: function () {
          const path = arguments[0]
          const renderData = arguments[1]

          expect(path).toBe('services/index')
          expect(renderData.services.map(service => service.name)).toEqual(
            expect.arrayContaining(['My Service 1', 'My Service 2', '', 'Direct Debit service'])
          )
          expect(cardGatewayAccountNamesOf(renderData, 'service-external-id-1')).toEqual(expect.arrayContaining(['account 2', 'account 5']))
          expect(cardGatewayAccountNamesOf(renderData, 'service-external-id-2')).toEqual(expect.arrayContaining(['account 3', 'account 6', 'account 7']))
          expect(cardGatewayAccountNamesOf(renderData, 'service-external-id-3')).toEqual(expect.arrayContaining(['account 4', 'account 9']))
          expect(directDebitGatewayAccountNamesOf(renderData, 'service-external-id-4')).toEqual(expect.arrayContaining([
            'DIRECT_DEBIT:6bugfqvub0isp3rqfknck5vq24',
            'DIRECT_DEBIT:ksdfhjhfd;sfksd34'
          ]))

          done()
        }
      }

      const cardGatewayAccountNamesOf = (renderData, serviceExternalId) => renderData.services.filter(s => s.external_id === serviceExternalId)[0].gateway_accounts.cardAccounts.map(g => g.service_name)
      const directDebitGatewayAccountNamesOf = (renderData, serviceExternalId) => renderData.services.filter(s => s.external_id === serviceExternalId)[0].gateway_accounts.directdebitAccounts.map(g => g.id)

      serviceSwitchController.getIndex(req, res)
    }
  )

  it(
    'should render page with no data even if user does not belong to any service',
    done => {
      const req = {
        user: userFixtures.validUserResponse({
          username: 'bob',
          service_roles: []
        }).getAsObject(),
        session: {}
      }

      const res = {
        render: function () {
          const path = arguments[0]
          const renderData = arguments[1]
          expect(path).toBe('services/index')
          expect(renderData.services).toHaveLength(0)
          done()
        }
      }

      serviceSwitchController.getIndex(req, res)
    }
  )
})

describe('service switch controller: switching', () => {
  it('should redirect to / with correct account id set', () => {
    const session = {}
    const gatewayAccount = {}

    const req = {
      originalUrl: 'http://bob.com?accountId=6',
      user: userFixtures.validUserResponse({
        username: 'bob',
        service_roles: [{
          service: {
            gateway_account_ids: ['6', '5']
          }
        }]
      }).getAsObject(),
      session: session,
      gateway_account: gatewayAccount,
      body: {
        gatewayAccountId: '6'
      }
    }

    const res = {
      redirect: function () {
        expect(gatewayAccount.currentGatewayAccountId).toBe('6')
        expect(arguments[0]).toBe(302)
        expect(arguments[1]).toBe('/')
      }
    }

    serviceSwitchController.postIndex(req, res)
  })

  it(
    'should not switch id if user not authorised to see account id',
    () => {
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
        redirect: function () {
          expect(session).toEqual({})
          expect(arguments[0]).toBe(302)
          expect(arguments[1]).toBe('/my-services')
        }
      }

      serviceSwitchController.postIndex(req, res)
    }
  )
})

describe('service switch controller: display added to the new service msg', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  it(
    'should render a list of services when user has multiple services and display added to new service message',
    done => {
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
        }).getAsObject(),
        session: {},
        query: {
          s: newServiceExternalId
        }
      }

      const res = {
        render: function () {
          const path = arguments[0]
          const renderData = arguments[1]
          expect(path).toBe('services/index')
          expect(renderData.new_service_name).toBe(newServiceName)
          done()
        }
      }

      serviceSwitchController.getIndex(req, res)
    }
  )
})
