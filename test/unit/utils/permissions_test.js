const { expect } = require('chai')
const proxyquire = require('proxyquire')

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
    const opts = {
      gateway_account_ids: ['1', '2', '3']
    }
    const user = validUser(opts).getAsObject()
    it('correctly identifies stripe and moto headers for relavent accounts', async () => {
      const { liveUserServicesGatewayAccounts } = proxyquire('./../../../app/utils/valid_account_id', {
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
      const result = await liveUserServicesGatewayAccounts(user)

      expect(result.headers.shouldGetStripeHeaders).to.be.true // eslint-disable-line
      expect(result.headers.shouldGetMotoHeaders).to.be.true // eslint-disable-line
    })

    it('correctly identifies non stripe and moto headers', async () => {
      const { liveUserServicesGatewayAccounts } = proxyquire('./../../../app/utils/valid_account_id', {
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
      const result = await liveUserServicesGatewayAccounts(user)

      expect(result.headers.shouldGetStripeHeaders).to.be.false // eslint-disable-line
      expect(result.headers.shouldGetMotoHeaders).to.be.false // eslint-disable-line
    })

    it('correctly filters live accounts', async () => {
      const { liveUserServicesGatewayAccounts } = proxyquire('./../../../app/utils/valid_account_id', {
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
      const result = await liveUserServicesGatewayAccounts(user)
      expect(result.accounts).to.equal('1,3')
    })
  })
})
