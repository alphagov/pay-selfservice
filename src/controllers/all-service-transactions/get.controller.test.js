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
  const modelMock = sinon.spy(() => ({
    isStripeAccount: true,
    filterLiveAccounts: true
  }))
  const responseMock = sinon.spy(() => null)
  const filterMock = sinon.spy(() => ['a-filter'])

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
  })

  describe('Stripe account', () => {
    it('should return a response with correct model and filters', async () => {
      await getController()(req, res, next)

      sinon.assert.calledWith(filterMock, req)
      sinon.assert.calledWith(modelMock, req, transactionSearchResponse, ['a-filter'], 'download-path', true, userPermittedAccountsSummary)

      sinon.assert.calledWith(responseMock, req, res, 'transactions/index', {
        isStripeAccount: true,
        filterLiveAccounts: true
      })
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
      './populateModel': {
        populateModel: modelMock
      },
      '../../utils/response': {
        response: responseMock
      },
      '../../paths': {
        allServiceTransactions: { download: 'download-path' },
        formattedPathFor: () => 'formatted-path'
      },
      '../../utils/filters.js': {
        getFilters: filterMock
      }
    })
  }
})
