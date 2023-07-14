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
  const userPermittedAccountsSummary = {
    gatewayAccountIds: [31],
    headers: { shouldGetStripeHeaders: true, shouldGetMotoHeaders: true },
    hasLiveAccounts: false,
    hasStripeAccount: true,
    hasTestStripeAccount: false
  }

  beforeEach(() => {
    req = {
      account: gatewayAccountFixture.validGatewayAccount({ payment_provider: 'stripe' }),
      flash: sinon.spy(),
      service,
      user,
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
    it('should get dispute states', async () => {
      userPermittedAccountsSummary.hasStripeAccount = true

      await getController()(req, res, next)

      sinon.assert.calledWith(allDisplayStateSelectorObjectsMock, true)
      sinon.assert.called(res.render)
    })
  })

  describe('Non stripe account', () => {
    it('should NOT get dispute states', async () => {
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
