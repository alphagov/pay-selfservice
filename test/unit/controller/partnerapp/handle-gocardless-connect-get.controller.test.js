'use strict'

const sinon = require('sinon')

let req, res, exchangeCodeStub

jest.mock('../../services/clients/direct-debit-connector.client', () => ({
  partnerApp: {
    exchangeCode: exchangeCodeStub
  }
}));

describe('When GoCardless Connect middleware receives a GET request', () => {
  beforeEach(() => {
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
        expect(true).toBe(true)
      },
      setHeader: sinon.stub(),
      render: sinon.stub()
    }

    exchangeCodeStub = sinon.stub().resolves()
  })

  describe('with all required parameters', () => {
    it('successfully parses the GET request and creates a POST request', () => {
      res.status = (code) => {
        expect(code).toBe(200)
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
        expect(code).toBe(400)
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
        expect(code).toBe(400)
      }
      const controller = getControllerWithMocks()
      controller.index(req, res)
    })
  })

  function getControllerWithMocks () {
    return require(
      '../../../../app/controllers/partnerapp/handle-gocardless-connect-get.controller'
    );
  }
})
