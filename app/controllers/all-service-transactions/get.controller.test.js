const sinon = require('sinon')
const proxyquire = require('proxyquire')
const User = require('../../models/User.class')
const userFixtures = require('../../../test/fixtures/user.fixtures')
const gatewayAccountFixture = require('../../../test/fixtures/gateway-account.fixtures')
const Service = require('../../models/Service.class')
const serviceFixtures = require('../../../test/fixtures/service.fixtures')
const ledgerTransactionFixture = require('../../../test/fixtures/ledger-transaction.fixtures')

describe('All service transactions - GET', () => {
  let req, res, next
  let allDisplayStateSelectorObjectsMock
  const user = new User(userFixtures.validUserResponse())
  const service = new Service(serviceFixtures.validServiceResponse({}))
  const transactionSearchResponse = ledgerTransactionFixture.validTransactionSearchResponse(
    { transactions: [] })
  let userPermittedAccountsSummary = {
    gatewayAccountIds: [31],
    headers: { shouldGetStripeHeaders: true, shouldGetMotoHeaders: true },
    hasLiveAccounts: false,
    hasStripeAccount: true,
    hasTestStripeAccount: false
  }

  beforeEach(() => {
    req = {
      account: gatewayAccountFixture.validGatewayAccount({ 'payment_provider': 'stripe' }),
      flash: sinon.spy(),
      service: service,
      user: user,
      params: {},
      url: 'http://selfservice/all-servce-transactions',
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
    it('should get dispute states for test transactions page - if dispute transactions search is enabled for test', async () => {
      process.env.ENABLE_TEST_TXS_SEARCH_BY_DISPUTE_STATUSES_FROM_DATE = '1627156355'
      userPermittedAccountsSummary.hasStripeAccount = true
      req.params.statusFilter = 'test'

      await getController()(req, res, next)

      sinon.assert.calledWith(allDisplayStateSelectorObjectsMock, true)
      sinon.assert.called(res.render)
    })

    it('should NOT get dispute states for test transactions page - if dispute transactions search is not enabled for test', async () => {
      process.env.ENABLE_TEST_TXS_SEARCH_BY_DISPUTE_STATUSES_FROM_DATE = '1753386755'
      userPermittedAccountsSummary.hasStripeAccount = true
      req.params.statusFilter = 'test'

      await getController()(req, res, next)

      sinon.assert.calledWith(allDisplayStateSelectorObjectsMock, false)
      sinon.assert.called(res.render)
    })

    it('should NOT get dispute states for test transactions page - if dispute transactions search is only enabled for live', async () => {
      process.env.ENABLE_LIVE_TXS_SEARCH_BY_DISPUTE_STATUSES_FROM_DATE = '1627156355'
      process.env.ENABLE_LIVE_TXS_SEARCH_BY_DISPUTE_STATUSES_FROM_DATE = '1753386755'
      userPermittedAccountsSummary.hasStripeAccount = true
      req.params.statusFilter = 'test'

      await getController()(req, res, next)

      sinon.assert.calledWith(allDisplayStateSelectorObjectsMock, false)
      sinon.assert.called(res.render)
    })

    it('should get dispute states for live transactions page - if dispute transactions search is enabled for live', async () => {
      process.env.ENABLE_LIVE_TXS_SEARCH_BY_DISPUTE_STATUSES_FROM_DATE = '1627156355'
      userPermittedAccountsSummary.hasStripeAccount = true
      req.params.statusFilter = 'live'

      await getController()(req, res, next)

      sinon.assert.calledWith(allDisplayStateSelectorObjectsMock, true)
      sinon.assert.called(res.render)
    })

    it('should NOT get dispute states for live transactions page - if dispute transactions search is enabled for live', async () => {
      process.env.ENABLE_LIVE_TXS_SEARCH_BY_DISPUTE_STATUSES_FROM_DATE = '1753386755'
      userPermittedAccountsSummary.hasStripeAccount = true
      req.params.statusFilter = 'live'

      await getController()(req, res, next)

      sinon.assert.calledWith(allDisplayStateSelectorObjectsMock, false)
      sinon.assert.called(res.render)
    })

    it('should NOT get dispute states for live transactions page - if dispute transactions search is only enabled for test', async () => {
      process.env.ENABLE_TEST_TXS_SEARCH_BY_DISPUTE_STATUSES_FROM_DATE = '1627156355'
      process.env.ENABLE_LIVE_TXS_SEARCH_BY_DISPUTE_STATUSES_FROM_DATE = '1753386755'
      userPermittedAccountsSummary.hasStripeAccount = true
      req.params.statusFilter = 'live'

      await getController()(req, res, next)

      sinon.assert.calledWith(allDisplayStateSelectorObjectsMock, false)
      sinon.assert.called(res.render)
    })
  })
  describe('Non stripe account', () => {
    it('should NOT get dispute states for TEST transactions page - if dispute transactions search is enabled for test', async () => {
      process.env.ENABLE_TEST_TXS_SEARCH_BY_DISPUTE_STATUSES_FROM_DATE = '1627156355'
      userPermittedAccountsSummary.hasStripeAccount = false
      req.params.statusFilter = 'test'
      await getController()(req, res, next)

      sinon.assert.calledWith(allDisplayStateSelectorObjectsMock, false)
      sinon.assert.called(res.render)
    })

    it('should NOT get dispute states for LIVE transactions page - if dispute transactions search is enabled for live', async () => {
      process.env.ENABLE_LIVE_TXS_SEARCH_BY_DISPUTE_STATUSES_FROM_DATE = '1627156355'
      userPermittedAccountsSummary.hasStripeAccount = false
      req.params.statusFilter = 'test'
      await getController()(req, res, next)

      sinon.assert.calledWith(allDisplayStateSelectorObjectsMock, false)
      sinon.assert.called(res.render)
    })
  })

  function getController () {
    return proxyquire('./get.controller', {
      '../../utils/permissions': {
        getGatewayAccountsFor: sinon.spy(() => Promise.resolve(userPermittedAccountsSummary))
      },
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
