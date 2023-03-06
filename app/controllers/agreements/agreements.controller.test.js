'use strict'

const sinon = require('sinon')
const proxyquire = require('proxyquire')
const { expect } = require('chai')

const serviceFixtures = require('../../../test/fixtures/service.fixtures')
const gatewayAccountFixtures = require('../../../test/fixtures/gateway-account.fixtures')
const agreementFixtures = require('../../../test/fixtures/agreement.fixtures')
const Service = require('../../models/Service.class')
const { RESTClientError, NotFoundError } = require('../../errors')

const agreements = agreementFixtures.validAgreementSearchResponse([{ reference: 'a-ref' }])
const responseSpy = sinon.spy()

const service = new Service(serviceFixtures.validServiceResponse())
const account = gatewayAccountFixtures.validGatewayAccountResponse()
let req, res, next

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
    it('should trim spaces from filters', async () => {
      req.query = {
        status: 'a-status',
        reference: ' a ref  '
      }
      req.url = 'http://selfservice/agreements?status=a-status&reference=+a+ref++'

      const getAgreementsSpy = sinon.spy(() => Promise.resolve(agreements))
      await getControllerWithMocks(getAgreementsSpy).listAgreements(req, res, next)

      const expectedFilters = {
        status: 'a-status',
        reference: 'a ref'
      }
      sinon.assert.calledWith(getAgreementsSpy, service.externalId, true, account.gateway_account_id, 1, expectedFilters)
      sinon.assert.calledWith(responseSpy, req, res, 'agreements/list', {
        agreements,
        filters: expectedFilters
      })
      expect(req.session).to.have.property('agreementsFilter')
        .to.eq('status=a-status&reference=+a+ref++')
    })

    it('should call next with NotFoundError when ledger returns 404', async () => {
      const error = new RESTClientError('Error from ledger', 'ledger', 404)
      const getAgreementsSpy = sinon.spy(() => Promise.reject(error))
      await getControllerWithMocks(getAgreementsSpy).listAgreements(req, res, next)

      sinon.assert.calledWith(next, sinon.match.instanceOf(NotFoundError))
    })
  })
})

function getControllerWithMocks (getAgreementsSpy) {
  return proxyquire('./agreements.controller', {
    './agreements.service': {
      agreements: getAgreementsSpy
    },
    '../../utils/response': {
      response: responseSpy
    }
  })
}
