const sinon = require('sinon')
const { expect } = require('chai')
const proxyquire = require('proxyquire')

const { ConnectorClient } = require('../../../app/services/clients/connector_client')

const { validUser } = require('./../../fixtures/user_fixtures')
const { validGatewayAccountResponse } = require('./../../fixtures/gateway_account_fixtures')

describe('gateway account filter utiltiies', () => {
  const { userServicesContainsGatewayAccount } = require('../../../app/utils/permissions')
  describe('gateway account exists on users service roles', () => {
    it('returns valid for gateway account belonging to user', () => {
      const opts = {
        gateway_account_ids: ['1', '2', '3']
      }
      const user = validUser(opts).getAsObject()
      const valid = userServicesContainsGatewayAccount('2', user)
      expect(valid).to.equal(true)
    })
    it('returns invalid for gateway account not belonging to user', () => {
      const opts = {
        gateway_account_ids: ['1', '2', '3']
      }
      const user = validUser(opts).getAsObject()
      const valid = userServicesContainsGatewayAccount('4', user)
      expect(valid).to.equal(false)
    })
  })

  describe('live accounts for a given user', () => {
    let accountSpy
    const opts = {
      gateway_account_ids: ['1', '2', '3']
    }
    const user = validUser(opts).getAsObject()

    beforeEach(() => {
      accountSpy = sinon.stub(ConnectorClient.prototype, 'getAccounts').callsFake(() => Promise.resolve({ accounts: [] }))
    })
    afterEach(() => accountSpy.restore())

    it('correctly identifies stripe and moto headers for relavent accounts', async () => {
      const { liveUserServicesGatewayAccounts } = proxyquire('./../../../app/utils/permissions', {
        '../services/clients/connector_client.js': {
          ConnectorClient: class {
            async getAccounts () {
              return {
                accounts: [
                  validGatewayAccountResponse({
                    payment_provider: 'stripe'
                  }).getPlain(),
                  validGatewayAccountResponse({
                    allow_moto: true
                  }).getPlain()
                ]
              }
            }
          }
        }
      })
      const result = await liveUserServicesGatewayAccounts(user, 'perm-1')

      expect(result.headers.shouldGetStripeHeaders).to.be.true // eslint-disable-line
      expect(result.headers.shouldGetMotoHeaders).to.be.true // eslint-disable-line
    })

    it('correctly identifies non stripe and moto headers', async () => {
      const { liveUserServicesGatewayAccounts } = proxyquire('./../../../app/utils/permissions', {
        '../services/clients/connector_client.js': {
          ConnectorClient: class {
            async getAccounts () {
              return {
                accounts: [
                  validGatewayAccountResponse().getPlain()
                ]
              }
            }
          }
        }
      })
      const result = await liveUserServicesGatewayAccounts(user, 'perm-1')

      expect(result.headers.shouldGetStripeHeaders).to.be.false // eslint-disable-line
      expect(result.headers.shouldGetMotoHeaders).to.be.false // eslint-disable-line
    })

    it('correctly filters live accounts', async () => {
      const { liveUserServicesGatewayAccounts } = proxyquire('./../../../app/utils/permissions', {
        '../services/clients/connector_client.js': {
          ConnectorClient: class {
            async getAccounts () {
              return {
                accounts: [
                  validGatewayAccountResponse({
                    gateway_account_id: '1',
                    type: 'live'
                  }).getPlain(),
                  validGatewayAccountResponse({
                    gateway_account_id: '2',
                    type: 'test'
                  }).getPlain(),
                  validGatewayAccountResponse({
                    gateway_account_id: '3',
                    type: 'live'
                  }).getPlain()
                ]
              }
            }
          }
        }
      })
      const result = await liveUserServicesGatewayAccounts(user, 'perm-1')
      expect(result.accounts).to.equal('1,3')
    })

    it('correctly filters services by users permission role', async () => {
      const { liveUserServicesGatewayAccounts } = proxyquire(
        './../../../app/utils/permissions', { '../services/clients/connector_client.js': ConnectorClient }
      )

      liveUserServicesGatewayAccounts(user, 'perm-1')
      sinon.assert.calledWith(accountSpy, { gatewayAccountIds: ['1', '2', '3'] })
    })

    it('does not interract with the backend if no services have the required permissions', () => {
      const { liveUserServicesGatewayAccounts } = proxyquire(
        './../../../app/utils/permissions', { '../services/clients/connector_client.js': ConnectorClient }
      )

      liveUserServicesGatewayAccounts(user, 'permission-user-does-not-have')
      sinon.assert.notCalled(accountSpy)
    })
  })
})
