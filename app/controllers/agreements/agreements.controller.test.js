'use strict'

const sinon = require('sinon')
const proxyquire = require('proxyquire')
const { expect } = require('chai')

const serviceFixtures = require('../../../test/fixtures/service.fixtures')
const agreementFixtures = require('../../../test/fixtures/agreement.fixtures')
const Service = require('../../models/Service.class')

const agreements = agreementFixtures.validAgreementSearchResponse([{ reference: 'a-ref' }])
const getAgreementsSpy = sinon.spy(() => Promise.resolve(agreements))
const responseSpy = sinon.spy()

const service = new Service(serviceFixtures.validServiceResponse())
let req, res, next

describe('The agreements controller', () => {
  beforeEach(() => {
    req = {
      isLive: true,
      service,
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

      await getControllerWithMocks().listAgreements(req, res, next)

      const expectedFilters = {
        status: 'a-status',
        reference: 'a ref'
      }
      sinon.assert.calledWith(getAgreementsSpy, service.externalId, true, 1, expectedFilters)
      sinon.assert.calledWith(responseSpy, req, res, 'agreements/list', {
        agreements,
        filters: expectedFilters
      })
      expect(req.session).to.have.property('agreementsFilter')
        .to.eq('status=a-status&reference=+a+ref++')
    })
  })
})

function getControllerWithMocks () {
  return proxyquire('./agreements.controller', {
    './agreements.service': {
      agreements: getAgreementsSpy
    },
    '../../utils/response': {
      response: responseSpy
    }
  })
}
