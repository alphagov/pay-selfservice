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
      account: gatewayAccountFixture.validGatewayAccount({ 'payment_provider': 'stripe' }),
      service: service,
      user: user,
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
    it('should get dispute states for test account transactions page - if dispute transactions search is enabled for test', async () => {
      process.env.ENABLE_TEST_TXS_SEARCH_BY_DISPUTE_STATUSES_FROM_DATE = '1627156355'
      req.account.type = 'test'
      await getController()(req, res, next)

      sinon.assert.calledWith(allDisplayStateSelectorObjectsMock, true)
      sinon.assert.called(res.render)
    })

    it('should NOT get dispute states for test account transactions page - if dispute transactions search is not enabled for test', async () => {
      process.env.ENABLE_TEST_TXS_SEARCH_BY_DISPUTE_STATUSES_FROM_DATE = '1753386755'
      req.account.type = 'test'

      await getController()(req, res, next)

      sinon.assert.calledWith(allDisplayStateSelectorObjectsMock, false)
      sinon.assert.called(res.render)
    })

    it('should NOT get dispute states for test account transactions page - if dispute transactions search is only enabled for live', async () => {
      process.env.ENABLE_LIVE_TXS_SEARCH_BY_DISPUTE_STATUSES_FROM_DATE = '1627156355'
      process.env.ENABLE_LIVE_TXS_SEARCH_BY_DISPUTE_STATUSES_FROM_DATE = '1753386755'
      req.account.type = 'test'

      await getController()(req, res, next)

      sinon.assert.calledWith(allDisplayStateSelectorObjectsMock, false)
      sinon.assert.called(res.render)
    })

    it('should get dispute states for live account transactions page - if dispute transactions search is enabled for live', async () => {
      process.env.ENABLE_LIVE_TXS_SEARCH_BY_DISPUTE_STATUSES_FROM_DATE = '1627156355'
      req.account.type = 'live'

      await getController()(req, res, next)

      sinon.assert.calledWith(allDisplayStateSelectorObjectsMock, true)
      sinon.assert.called(res.render)
    })

    it('should NOT get dispute states for live account transactions page - if dispute transactions search is enabled for live', async () => {
      process.env.ENABLE_LIVE_TXS_SEARCH_BY_DISPUTE_STATUSES_FROM_DATE = '1753386755'
      req.account.type = 'live'

      await getController()(req, res, next)

      sinon.assert.calledWith(allDisplayStateSelectorObjectsMock, false)
      sinon.assert.called(res.render)
    })

    it('should NOT get dispute states for live account transactions page - if dispute transactions search is only enabled for test', async () => {
      process.env.ENABLE_TEST_TXS_SEARCH_BY_DISPUTE_STATUSES_FROM_DATE = '1627156355'
      process.env.ENABLE_LIVE_TXS_SEARCH_BY_DISPUTE_STATUSES_FROM_DATE = '1753386755'
      req.account.type = 'live'

      await getController()(req, res, next)

      sinon.assert.calledWith(allDisplayStateSelectorObjectsMock, false)
      sinon.assert.called(res.render)
    })
  })
  describe('Non stripe account', () => {
    it('should NOT get dispute states for TEST account transactions page - if dispute transactions search is enabled for test', async () => {
      process.env.ENABLE_TEST_TXS_SEARCH_BY_DISPUTE_STATUSES_FROM_DATE = '1627156355'
      req.account.payment_provider = 'sandbox'
      req.account.type = 'test'

      await getController()(req, res, next)

      sinon.assert.calledWith(allDisplayStateSelectorObjectsMock, false)
      sinon.assert.called(res.render)
    })

    it('should NOT get dispute states for LIVE account transactions page - if dispute transactions search is enabled for live', async () => {
      process.env.ENABLE_LIVE_TXS_SEARCH_BY_DISPUTE_STATUSES_FROM_DATE = '1627156355'
      req.account.payment_provider = 'sandbox'
      req.account.type = 'live'

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
