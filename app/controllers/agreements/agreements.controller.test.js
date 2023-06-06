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
const User = require('../../models/User.class')
const userFixtures = require('../../../test/fixtures/user.fixtures')

const agreementsServiceSpy = {
  agreements: sinon.spy(() => Promise.resolve(agreements)),
  agreement: sinon.spy(() => Promise.resolve(singleAgreement)),
  cancelAgreement: sinon.spy(() => Promise.resolve())
}

const responseSpy = {
  response: sinon.spy()
}

const transactionsServiceSpy = {
  search: sinon.spy(() => Promise.resolve(transactions))
}

const gatewayAccountId = 111
const gatewayAccountExternalId = 'a-gateway-account-id'
const agreementId = 'an-agreement-id'
const service = new Service(serviceFixtures.validServiceResponse())
const account = gatewayAccountFixtures.validGatewayAccountResponse({ gateway_account_id: gatewayAccountId })
const agreements = agreementFixtures.validAgreementSearchResponse([{ reference: 'a-ref' }])
const transactions = transactionFixtures.validTransactionSearchResponse({ transactions: [] })
const singleAgreement = agreementFixtures.validAgreementResponse({ external_id: agreementId })

let req, res, next
let user = new User(userFixtures.validUserResponse())

describe('The agreements controller', () => {
  beforeEach(() => {
    req = {
      query: {},
      url: 'http://selfservice/agreements',
      isLive: true,
      service,
      account,
      session: {},
      user
    }
    res = {}
    next = sinon.spy()

    singleAgreement.status = 'ACTIVE'
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
      req.session.agreementsFilter = 'test'
      req.params = {
        agreementId: agreementId
      }

      agreementsServiceSpy.agreement.resetHistory()
      responseSpy.response.resetHistory()
      transactionsServiceSpy.search.resetHistory()
      req.user = new User(userFixtures.validUserResponse())
      singleAgreement.status = 'ACTIVE'
    })

    it('should call agreement details correctly', async () => {
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
        listFilter: req.session.agreementsFilter,
        isShowCancelAgreementFunctionality: true
      })
    })

    it('should show cancel agreement functionality when user has agreements:update permission and agreement is active', async () => {
      const serviceRoles = [{
        service: {
          name: 'System Generated',
          external_id: service.externalId
        },
        role: { name: 'admin', description: 'Administrator', permissions: [{ name: 'agreements:update' }] }
      }]

      req.user = new User(userFixtures.validUserResponse({
        service_roles: serviceRoles
      }))

      const transactionsFilter = { agreementId: req.params.agreementId, pageSize: 5 }

      await getControllerWithMocks(agreementsServiceSpy, responseSpy, transactionsServiceSpy)
        .agreementDetail(
          req,
          res,
          next
        )

      const formattedTransactions = buildPaymentList(transactions, {}, req.account.gateway_account_id, transactionsFilter)

      sinon.assert.calledWith(responseSpy.response, req, res, 'agreements/detail', {
        agreement: singleAgreement,
        transactions: formattedTransactions,
        listFilter: req.session.agreementsFilter,
        isShowCancelAgreementFunctionality: true
      })
    })

    it('should not show cancel agreement functionality when user does not have agreements:update permission and agreement is active', async () => {
      req.user = new User(userFixtures.validUserResponse({
        service_roles: [
          {
            service: {
              external_id: req.service.external_id
            },
            role: {
              permissions: [{ name: 'a-different-permission' }]
            }
          }
        ]
      }))

      const transactionsFilter = { agreementId: req.params.agreementId, pageSize: 5 }

      await getControllerWithMocks(agreementsServiceSpy, responseSpy, transactionsServiceSpy)
        .agreementDetail(
          req,
          res,
          next
        )

      const formattedTransactions = buildPaymentList(transactions, {}, req.account.gateway_account_id, transactionsFilter)

      sinon.assert.calledWith(responseSpy.response, req, res, 'agreements/detail', {
        agreement: singleAgreement,
        transactions: formattedTransactions,
        listFilter: req.session.agreementsFilter,
        isShowCancelAgreementFunctionality: false
      })
    })

    it('should not show cancel agreement functionality when agreement is NOT active', async () => {
      singleAgreement.status = 'CREATED'

      const transactionsFilter = { agreementId: req.params.agreementId, pageSize: 5 }

      await getControllerWithMocks(agreementsServiceSpy, responseSpy, transactionsServiceSpy)
        .agreementDetail(
          req,
          res,
          next
        )

      const formattedTransactions = buildPaymentList(transactions, {}, req.account.gateway_account_id, transactionsFilter)

      sinon.assert.calledWith(responseSpy.response, req, res, 'agreements/detail', {
        agreement: singleAgreement,
        transactions: formattedTransactions,
        listFilter: req.session.agreementsFilter,
        isShowCancelAgreementFunctionality: false
      })
    })
  })

  describe('cancelAgreement', () => {
    beforeEach(() => {
      req.session.agreementsFilter = 'test'
      req.params = {
        agreementId,
        gatewayAccountExternalId: gatewayAccountExternalId
      }
      req.user = new User(userFixtures.validUserResponse())
      req.flash = sinon.spy()
      res.redirect = sinon.spy()
      agreementsServiceSpy.cancelAgreement.resetHistory()
    })

    it('should call cancel agreement correctly', async () => {
      await getControllerWithMocks(agreementsServiceSpy, responseSpy, transactionsServiceSpy)
        .cancelAgreement(
          req,
          res,
          next
        )

      sinon.assert.calledWith(agreementsServiceSpy.cancelAgreement, gatewayAccountId, agreementId, req.user.email, req.user.externalId)
      sinon.assert.calledWith(req.flash, 'generic', 'Agreement cancelled')
      sinon.assert.calledWith(
        res.redirect,
        '/test/service/cp5wa/account/a-valid-external-id/agreements/an-agreement-id')
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
