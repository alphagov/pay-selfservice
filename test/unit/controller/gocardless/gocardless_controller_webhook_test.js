'use strict'

const controller = require('../../../../app/controllers/direct_debit/gocardless_oauth_controller')
const baseClient = require('../../../../app/services/clients/base_client/base_client')
const gocardlessClient = require('../../../../app/services/clients/gocardless_client')

const {expect} = require('chai')
const sinon = require('sinon')

let req, res, stubbedBaseClientPost, stubbedBaseClientPatch

describe('When GoCardless Controller receives a GET request', function () {
  beforeEach(function () {
    req = {
      correlationId: 'some-correlation-id',
      query: {
        state: 'a-csrf-token.123',
        code: 'a-test-code'
      }
    }

    res = {
      end: () => {
        expect(true).to.equal(true)
      }
    }

    stubbedBaseClientPost = baseClient.post = sinon.stub()
    stubbedBaseClientPost.resolves({
      access_token: 'e72e16c7e42f292c6912e7710c123347ae178b4a',
      scope: 'read_write',
      token_type: 'bearer',
      email: 'accounts@example.com',
      organisation_id: 'OR123'
    })

    stubbedBaseClientPatch = baseClient.patch = sinon.stub()
    stubbedBaseClientPatch.resolves({})
  })

  afterEach(() => {
    stubbedBaseClientPost.reset()
    stubbedBaseClientPatch.reset()
  })

  it('successfully parses the GET request and creates a POST request', () => {
    res.status = (code) => {
      expect(code).to.equal(200)
    }
    controller.oauthCompleteGet(req, res)
  })

  describe('and invalid correlation id', () => {
    beforeEach(() => {
      req.correlationId = ''
    })
    afterEach(() => {
      req.correlationId = 'some-correlation-id'
    })

    it('returns bad request', () => {
      res.status = (code) => {
        expect(code).to.equal(400)
      }
      controller.oauthCompleteGet(req, res)
    })
  })

  describe('and invalid state field', () => {
    beforeEach(() => {
      req.query.state = 'i-am-a-wrong-state'
    })
    afterEach(() => {
      req.query.state = 'a-csrf-token.123'
    })

    it('returns bad request', () => {
      res.status = (code) => {
        expect(code).to.equal(400)
      }
      controller.oauthCompleteGet(req, res)
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
      controller.oauthCompleteGet(req, res)
    })
  })

  describe('and making a POST request to GoCardless throws exception', () => {
    let stubbedPostOAuthToken
    beforeEach(() => {
      stubbedPostOAuthToken = gocardlessClient.postOAuthToken = sinon.stub()
      stubbedPostOAuthToken.rejects(new Error('oh noes!'))
    })
    afterEach(() => {
      stubbedPostOAuthToken.reset()
    })
    it('returns internal server error', () => {
      res.status = (code) => {
        expect(code).to.equal(500)
      }
      controller.oauthCompleteGet(req, res)
    })
  })
})
