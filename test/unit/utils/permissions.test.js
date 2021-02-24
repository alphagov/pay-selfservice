const sinon = require('sinon')
const { expect } = require('chai')
const proxyquire = require('proxyquire')

const { ConnectorClient } = require('../../../app/services/clients/connector.client')
const User = require('../../../app/models/User.class')

const { validUser } = require('../../fixtures/user.fixtures')
const { validGatewayAccountResponse } = require('../../fixtures/gateway-account.fixtures')

describe('gateway account filter utiltiies', () => {
  const { userServicesContainsGatewayAccount } = require('../../../app/utils/permissions')
  describe('gateway account exists on users service roles', () => {
    it('returns valid for gateway account belonging to user', () => {
      const opts = {
        gateway_account_ids: ['1', '2', '3']
      }
      const user = new User(validUser(opts))
      const valid = userServicesContainsGatewayAccount('2', user)
      expect(valid).to.equal(true)
    })
    it('returns invalid for gateway account not belonging to user', () => {
      const opts = {
        gateway_account_ids: ['1', '2', '3']
      }
      const user = new User(validUser(opts))
      const valid = userServicesContainsGatewayAccount('4', user)
      expect(valid).to.equal(false)
    })
  })

  describe('live accounts for a given user', () => {
    let accountSpy
    const opts = {
      gateway_account_ids: ['1', '2', '3']
    }
    const user = new User(validUser(opts))

    beforeEach(() => {
      accountSpy = sinon.stub(ConnectorClient.prototype, 'getAccounts').callsFake(() => Promise.resolve({ accounts: [] }))
    })
    afterEach(() => accountSpy.restore())

    it('correctly identifies stripe and moto headers for relavent accounts', async () => {
      const { getGatewayAccountsFor } = proxyquire('./../../../app/utils/permissions', {
        '../services/clients/connector.client.js': {
          ConnectorClient: class {
            async getAccounts () {
              return {
                accounts: [
                  validGatewayAccountResponse({
                    payment_provider: 'stripe'
                  }),
                  validGatewayAccountResponse({
                    allow_moto: true
                  })
                ]
              }
            }
          }
        }
      })
      const result = await getGatewayAccountsFor(user, true, 'perm-1')

      expect(result.headers.shouldGetStripeHeaders).to.be.true // eslint-disable-line
      expect(result.headers.shouldGetMotoHeaders).to.be.true // eslint-disable-line
      expect(result.hasLiveAccounts).to.equal(false)
      expect(result.hasTestStripeAccount).to.equal(true)
    })

    it('correctly identifies non stripe and moto headers', async () => {
      const { getGatewayAccountsFor } = proxyquire('./../../../app/utils/permissions', {
        '../services/clients/connector.client.js': {
          ConnectorClient: class {
            async getAccounts () {
              return {
                accounts: [
                  validGatewayAccountResponse()
                ]
              }
            }
          }
        }
      })
      const result = await getGatewayAccountsFor(user, true, 'perm-1')

      expect(result.headers.shouldGetStripeHeaders).to.be.false // eslint-disable-line
      expect(result.headers.shouldGetMotoHeaders).to.be.false // eslint-disable-line
    })

    it('correctly filters accounts', async () => {
      const { getGatewayAccountsFor } = proxyquire('./../../../app/utils/permissions', {
        '../services/clients/connector.client.js': {
          ConnectorClient: class {
            async getAccounts () {
              return {
                accounts: [
                  validGatewayAccountResponse({
                    gateway_account_id: '1',
                    type: 'live'
                  }),
                  validGatewayAccountResponse({
                    gateway_account_id: '2',
                    type: 'test'
                  }),
                  validGatewayAccountResponse({
                    gateway_account_id: '3',
                    type: 'live'
                  })
                ]
              }
            }
          }
        }
      })
      const liveResult = await getGatewayAccountsFor(user, true, 'perm-1')
      expect(liveResult.gatewayAccountIds).to.deep.equal([ '1', '3' ])

      const testResult = await getGatewayAccountsFor(user, false, 'perm-1')
      expect(testResult.gatewayAccountIds).to.deep.equal([ '2' ])
      expect(testResult.hasLiveAccounts).to.equal(true)
      expect(testResult.hasTestStripeAccount).to.equal(false)
    })

    it('correctly filters services by users permission role', async () => {
      const { getGatewayAccountsFor } = proxyquire(
        './../../../app/utils/permissions', { '../services/clients/connector.client.js': ConnectorClient }
      )

      getGatewayAccountsFor(user, true, 'perm-1')
      sinon.assert.calledWith(accountSpy, { gatewayAccountIds: ['1', '2', '3'] })
    })

    it('does not interract with the backend if no services have the required permissions', () => {
      const { getGatewayAccountsFor } = proxyquire(
        './../../../app/utils/permissions', { '../services/clients/connector.client.js': ConnectorClient }
      )

      getGatewayAccountsFor(user, true, 'permission-user-does-not-have')
      sinon.assert.notCalled(accountSpy)
    })
  })
})
