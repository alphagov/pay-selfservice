const sinon = require('sinon')
const proxyquire = require('proxyquire')
const User = require('../../models/User.class')
const userFixtures = require('../../../test/fixtures/user.fixtures')
const gatewayAccountFixture = require('../../../test/fixtures/gateway-account.fixtures')
const Service = require('../../models/Service.class')
const serviceFixtures = require('../../../test/fixtures/service.fixtures')
const { getFilters } = require('../../utils/filters.js')
const { expect } = require('chai')

describe('Populate Model', () => {
  let req
  let allDisplayStateSelectorObjectsMock
  const user = new User(userFixtures.validUserResponse())
  const service = new Service(serviceFixtures.validServiceResponse({}))

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
      url: 'http://selfservice/all-service-transactions',
      session: {},
      headers: {
        'x-request-id': 'correlation-id'
      }
    }
    allDisplayStateSelectorObjectsMock = sinon.spy(() => ([{}]))
  })

  describe('Stripe account', () => {
    it('should get dispute states', async () => {
      const filters = getFilters(req)
      const searchResultOutput = { results: [] }
      const downloadRoute = 'download_route'
      const filterLiveAccounts = true
      await populateModel()(req, searchResultOutput, filters, downloadRoute, filterLiveAccounts, userPermittedAccountsSummary)

      sinon.assert.calledWith(allDisplayStateSelectorObjectsMock, true)
    })
  })

  describe('Non stripe account', () => {
    it('should NOT get dispute states', async () => {
      req.params.statusFilter = 'test'
      const filters = getFilters(req)
      const searchResultOutput = { results: [] }
      const downloadRoute = 'download_route'
      const filterLiveAccounts = true
      userPermittedAccountsSummary.hasStripeAccount = false
      await populateModel()(req, searchResultOutput, filters, downloadRoute, filterLiveAccounts, userPermittedAccountsSummary)
      sinon.assert.calledWith(allDisplayStateSelectorObjectsMock, false)
    })
  })

  describe('Error results when from date is later than to date', () => {
    const invalidDatesReq = {
      account: gatewayAccountFixture.validGatewayAccount({ 'payment_provider': 'stripe' }),
      service: service,
      user: user,
      params: {},
      query: {
        fromDate: '03/5/2018',
        fromTime: '01:00:00',
        toDate: '01/5/2018',
        toTime: '01:00:00'
      },
      url: 'http://selfservice/all-service-transactions',
      session: {}
    }

    const filters = getFilters(invalidDatesReq)
    const searchResultOutput = { results: [] }
    const downloadRoute = 'download_route'
    const filterLiveAccounts = true
    userPermittedAccountsSummary.hasStripeAccount = true

    it('should return a model including invalid date range', async () => {
      const model = await populateModel()(req, searchResultOutput, filters, downloadRoute, filterLiveAccounts, userPermittedAccountsSummary)
      expect(model).to.deep.include({
        'isInvalidDateRange': true,
        'hasResults': false,
        'fromDateParam': '03/5/2018',
        'toDateParam': '01/5/2018'
      })
    })
  })

  function populateModel () {
    return proxyquire('./populateModel', {
      '../../services/clients/connector.client.js': {
        ConnectorClient: class {async getAllCardTypes () { return {} }}
      },
      '../../utils/states': {
        allDisplayStateSelectorObjects: allDisplayStateSelectorObjectsMock
      }
    }).populateModel
  }
})
