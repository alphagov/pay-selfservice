'use strict'

const sinon = require('sinon')
const proxyquire = require('proxyquire')
const { expect } = require('chai')

const serviceFixtures = require('../../../test/fixtures/service.fixtures')
const gatewayAccountFixtures = require('../../../test/fixtures/gateway-account.fixtures')
const agreementFixtures = require('../../../test/fixtures/agreement.fixtures')
const transactionFixtures = require('../../../test/fixtures/ledger-transaction.fixtures')
const Service = require('../../models/Service.class')
const { RESTClientError, NotFoundError } = require('../../errors')
const { buildPaymentList } = require('../../utils/transaction-view')

const agreements = agreementFixtures.validAgreementSearchResponse([{ reference: 'a-ref' }])
const singleAgreement = agreementFixtures.validAgreementResponse()
const transactions = transactionFixtures.validTransactionSearchResponse({ transactions: [] })

const agreementsServiceSpy = {
  agreements: sinon.spy(() => Promise.resolve(agreements)),
  agreement: sinon.spy(() => Promise.resolve(singleAgreement))
}

const responseSpy = {
  response: sinon.spy()
}

const transactionsServiceSpy = {
  search: sinon.spy(() => Promise.resolve(transactions))
}

const service = new Service(serviceFixtures.validServiceResponse())
const account = gatewayAccountFixtures.validGatewayAccountResponse()
let req, res, next
const agreementId = 'an-agreement-id'

describe('The agreements controller', () => {
  beforeEach(() => {
    req = {
      query: {},
      url: 'http://selfservice/agreements',
      isLive: true,
      service,
      account,
      session: {}
    }
    res = {}
    next = sinon.spy()
  })

  describe('listAgreements', () => {
    beforeEach(() => {
      agreementsServiceSpy.agreements.resetHistory()
      responseSpy.response.resetHistory()
    })

    it('should trim spaces from filters', async () => {
      req.query = {
        status: 'a-status',
        reference: ' a ref  '
      }
      req.url = 'http://selfservice/agreements?status=a-status&reference=+a+ref++'

      await getControllerWithMocks(agreementsServiceSpy, responseSpy, transactionsServiceSpy).listAgreements(req, res, next)

      const expectedFilters = {
        status: 'a-status',
        reference: 'a ref'
      }
      sinon.assert.calledWith(agreementsServiceSpy.agreements, service.externalId, true, account.gateway_account_id, 1, expectedFilters)
      sinon.assert.calledWith(responseSpy.response, req, res, 'agreements/list', {
        agreements,
        filters: expectedFilters
      })
      expect(req.session).to.have.property('agreementsFilter')
        .to.eq('status=a-status&reference=+a+ref++')
    })

    it('should call next with NotFoundError when ledger returns 404', async () => {
      const error = new RESTClientError('Error from ledger', 'ledger', 404)
      agreementsServiceSpy.agreements = sinon.spy(() => Promise.reject(error))
      await getControllerWithMocks(agreementsServiceSpy, responseSpy, transactionsServiceSpy).listAgreements(req, res, next)

      sinon.assert.calledWith(next, sinon.match.instanceOf(NotFoundError))
    })
  })

  describe('agreementDetails', () => {
    beforeEach(() => {
      agreementsServiceSpy.agreement.resetHistory()
      responseSpy.response.resetHistory()
      transactionsServiceSpy.search.resetHistory()
    })

    it('should call agreement details correctly', async () => {
      req.session.agreementsFilter = 'test'
      req.params = {
        agreementId: agreementId
      }

      const transactionsFilter = { agreementId: req.params.agreementId, pageSize: 5 }

      await getControllerWithMocks(agreementsServiceSpy, responseSpy, transactionsServiceSpy)
        .agreementDetail(
          req,
          res,
          next
        )

      sinon.assert.calledWith(agreementsServiceSpy.agreement, agreementId, service.externalId)
      sinon.assert.calledWith(transactionsServiceSpy.search,
        [req.account.gateway_account_id],
        transactionsFilter
      )

      const formattedTransactions = buildPaymentList(transactions, {}, req.account.gateway_account_id, transactionsFilter)

      sinon.assert.calledWith(responseSpy.response, req, res, 'agreements/detail', {
        agreement: singleAgreement,
        transactions: formattedTransactions,
        listFilter: req.session.agreementsFilter
      })
    })
  })
})

function getControllerWithMocks (
  agreementsServiceSpy,
  responseSpy,
  transactionsServiceSpy) {
  return proxyquire('./agreements.controller', {
    './agreements.service': agreementsServiceSpy,
    '../../utils/response': responseSpy,
    '../../services/transaction.service': transactionsServiceSpy
  })
}
