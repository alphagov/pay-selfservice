'use strict'

const nock = require('nock')
const sinon = require('sinon')

const gatewayAccountFixtures = require('../../../fixtures/gateway-account.fixtures')
const controller = require('../../../../app/controllers/api-keys/get-index.controller')

const { PUBLIC_AUTH_URL } = process.env

const GATEWAY_ACCOUNT_ID = '182364'

const TOKEN_1 = {
  issued_date: '15 May 2018 - 09:13',
  last_used: null,
  token_link: 'fb3f3892-558e-4adb-8efa-6eed3b207713',
  description: 'Hello World',
  token_type: 'CARD',
  created_by: 'TKAS4OIpm2qpC7qxEP45Uuql410HQqmE@example.com'
}

const TOKEN_2 = {
  issued_date: '14 May 2018 - 14:18',
  last_used: '14 May 2018 - 14:26',
  token_link: 'd7c4ff92-a3f6-4443-a1cb-3123591730ae',
  description: 'Token for “A better service name” payment link',
  token_type: 'CARD',
  created_by: 'TKAS4OIpm2qpC7qxEP45Uuql410HQqmE@example.com'
}

const mockGetActiveAPIKeys = gatewayAccountId => {
  return nock(PUBLIC_AUTH_URL).get(`/${gatewayAccountId}`)
}

describe('API keys index', () => {
  const req = {
    account: gatewayAccountFixtures.validGatewayAccountResponse({
      gateway_account_id: GATEWAY_ACCOUNT_ID
    })
  }
  let res
  beforeEach(() => {
    res = {
      render: sinon.spy()
    }
  })
  afterEach(() => {
    nock.cleanAll()
  })

  describe('when no API keys exist', () => {
    it('should not return any API keys', async () => {
      mockGetActiveAPIKeys(GATEWAY_ACCOUNT_ID).reply(200, [])

      await controller(req, res)

      sinon.assert.calledWith(res.render, 'api-keys/index', sinon.match({
        'tokens': [],
        'tokens_singular': false
      }))
    })
  })

  describe('when one API key exists', () => {
    it('should return one API key', async () => {
      mockGetActiveAPIKeys(GATEWAY_ACCOUNT_ID).reply(200, { tokens: [TOKEN_1] })

      await controller(req, res)

      sinon.assert.calledWith(res.render, 'api-keys/index', sinon.match({
        'tokens': [TOKEN_1],
        'tokens_singular': true
      }))
    })
  })

  describe('when more than one API key exists', () => {
    it('should return two API keys', async () => {
      mockGetActiveAPIKeys(GATEWAY_ACCOUNT_ID).reply(200, { tokens: [TOKEN_1, TOKEN_2] })

      await controller(req, res)

      sinon.assert.calledWith(res.render, 'api-keys/index', sinon.match({
        'tokens': [TOKEN_1, TOKEN_2],
        'tokens_singular': false
      }))
    })
  })
})
