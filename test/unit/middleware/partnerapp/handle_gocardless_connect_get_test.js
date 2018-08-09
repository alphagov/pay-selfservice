'use strict'

const getHandler = require('../../../../app/middleware/partnerapp/handle_gocardless_connect_get')
const baseClient = require('../../../../app/services/clients/base_client/base_client')
const directDebitClient = require('../../../../app/services/clients/direct_debit_connector_client')

const {expect} = require('chai')
const sinon = require('sinon')

let req, res, stubbedBaseClientPost, stubbedGetGatewayAccount

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
      }
    }

    stubbedBaseClientPost = baseClient.post = sinon.stub()
    stubbedBaseClientPost.resolves({})

    stubbedGetGatewayAccount = directDebitClient.gatewayAccount.get = sinon.stub()
    stubbedGetGatewayAccount.resolves({
      type: 'test'
    })
  })

  afterEach(() => {
    stubbedBaseClientPost.reset()
    stubbedGetGatewayAccount.reset()
  })

  describe('with all required parameters', () => {
    it('successfully parses the GET request and creates a POST request', () => {
      res.status = (code) => {
        expect(code).to.equal(200)
      }
      getHandler.index(req, res)
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
      getHandler.index(req, res)
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
      getHandler.index(req, res)
    })
  })
})
