'use strict'

const { expect } = require('chai')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

let req, res, exchangeCodeStub

describe('When GoCardless Connect middleware receives a GET request', function () {
  beforeEach(function () {
    req = {
      account: {
        type: 'test'
      },
      query: {
        state: 'some-test-state',
        code: 'a-test-code'
      }
    }

    res = {
      end: () => {
        expect(true).to.equal(true)
      },
      setHeader: sinon.stub(),
      render: sinon.stub()
    }

    exchangeCodeStub = sinon.stub().resolves()
  })

  describe('with all required parameters', () => {
    it('successfully parses the GET request and creates a POST request', () => {
      res.status = (code) => {
        expect(code).to.equal(200)
      }
      const controller = getControllerWithMocks()
      controller.index(req, res)
    })
  })

  describe('and invalid state field', () => {
    beforeEach(() => {
      req.query.state = 'i-am-a-wrong-state'
    })
    afterEach(() => {
      req.query.state = 'some-test-state'
    })

    it('returns bad request', () => {
      res.status = (code) => {
        expect(code).to.equal(400)
      }
      const controller = getControllerWithMocks()
      controller.index(req, res)
    })
  })

  describe('and missing GoCardless code', () => {
    beforeEach(() => {
      req.query.code = ''
    })
    afterEach(() => {
      req.query.code = 'a-test-code'
    })
    it('then returns bad request', () => {
      res.status = (code) => {
        expect(code).to.equal(400)
      }
      const controller = getControllerWithMocks()
      controller.index(req, res)
    })
  })

  function getControllerWithMocks () {
    return proxyquire('../../../../app/controllers/partnerapp/handle-gocardless-connect-get', {
      '../../services/clients/direct-debit-connector.client': {
        partnerApp: {
          exchangeCode: exchangeCodeStub
        }
      }
    })
  }
})
