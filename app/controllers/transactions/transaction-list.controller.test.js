const sinon = require('sinon')
const proxyquire = require('proxyquire')
const User = require('../../models/User.class')
const userFixtures = require('../../../test/fixtures/user.fixtures')
const gatewayAccountFixture = require('../../../test/fixtures/gateway-account.fixtures')
const Service = require('../../models/Service.class')
const serviceFixtures = require('../../../test/fixtures/service.fixtures')
const ledgerTransactionFixture = require('../../../test/fixtures/ledger-transaction.fixtures')

describe('List transactions - GET', () => {
  let req, res, next
  let allDisplayStateSelectorObjectsMock
  const user = new User(userFixtures.validUserResponse())
  const service = new Service(serviceFixtures.validServiceResponse({}))
  const transactionSearchResponse = ledgerTransactionFixture.validTransactionSearchResponse(
    { transactions: [] })

  beforeEach(() => {
    req = {
      account: gatewayAccountFixture.validGatewayAccount({ payment_provider: 'stripe' }),
      service,
      user,
      params: {},
      url: 'http://selfservice/account/accountId/transactions',
      session: {},
      headers: {
        'x-request-id': 'correlation-id'
      }
    }
    res = {
      render: sinon.spy()
    }
    next = sinon.spy()
    allDisplayStateSelectorObjectsMock = sinon.spy(() => ([{}]))
  })

  describe('Stripe account', () => {
    beforeEach(() => {
      req.account.payment_provider = 'stripe'
    })
    it('should get dispute states for stripe account ', async () => {
      await getController()(req, res, next)

      sinon.assert.calledWith(allDisplayStateSelectorObjectsMock, true)
      sinon.assert.called(res.render)
    })
  })
  describe('Non stripe account', () => {
    it('should NOT get dispute states for non-stripe account', async () => {
      req.account.payment_provider = 'sandbox'

      await getController()(req, res, next)

      sinon.assert.calledWith(allDisplayStateSelectorObjectsMock, false)
      sinon.assert.called(res.render)
    })
  })

  function getController () {
    return proxyquire('./transaction-list.controller', {
      '../../services/transaction.service': {
        search: sinon.spy(() => Promise.resolve(transactionSearchResponse))
      },
      '../../services/clients/connector.client.js': {
        ConnectorClient: class {async getAllCardTypes () { return {} }}
      },
      '../../utils/states': {
        allDisplayStateSelectorObjects: allDisplayStateSelectorObjectsMock
      }
    })
  }
})
