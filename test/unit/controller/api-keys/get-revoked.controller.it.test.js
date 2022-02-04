'use strict'

const nock = require('nock')
const sinon = require('sinon')

const gatewayAccountFixtures = require('../../../fixtures/gateway-account.fixtures')
const controller = require('../../../../app/controllers/api-keys/get-revoked.controller')

const { PUBLIC_AUTH_URL } = process.env

const GATEWAY_ACCOUNT_ID = '182364'

const TOKEN_1 = {
  issued_date: '14 May 2018 - 15:33',
  last_used: null,
  token_link: '02227212-88fd-4b42-a9fc-671ae7155cd0',
  description: 'gg',
  token_type: 'CARD',
  revoked: '14 May 2018 - 15:34',
  created_by: 'TKAS4OIpm2qpC7qxEP45Uuql410HQqmE@example.com'
}

const TOKEN_2 = {
  issued_date: '14 May 2018 - 15:33',
  last_used: null,
  token_link: '02227212-88fd-4b42-a9fc-4763733353',
  description: 'gg',
  token_type: 'CARD',
  revoked: '14 May 2018 - 15:34',
  created_by: 'TKAS4OIpm2qpC7qxEP45Uuql410HQqmE@example.com'
}

const mockGetRevokedAPIKeys = gatewayAccountId => {
  return nock(PUBLIC_AUTH_URL).get(`/${gatewayAccountId}?state=revoked`)
}

describe('Revoked API keys index', () => {
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
      mockGetRevokedAPIKeys(GATEWAY_ACCOUNT_ID).reply(200, [])

      await controller(req, res)

      sinon.assert.calledWith(res.render, 'api-keys/revoked-keys', sinon.match({
        tokens: [],
        tokens_singular: false
      }))
    })
  })

  describe('when one API key exists', () => {
    it('should return one API key', async () => {
      mockGetRevokedAPIKeys(GATEWAY_ACCOUNT_ID).reply(200, { tokens: [TOKEN_1] })

      await controller(req, res)

      sinon.assert.calledWith(res.render, 'api-keys/revoked-keys', sinon.match({
        tokens: [TOKEN_1],
        tokens_singular: true
      }))
    })
  })

  describe('when more than one API key exists', () => {
    it('should return two API keys', async () => {
      mockGetRevokedAPIKeys(GATEWAY_ACCOUNT_ID).reply(200, { tokens: [TOKEN_1, TOKEN_2] })

      await controller(req, res)

      sinon.assert.calledWith(res.render, 'api-keys/revoked-keys', sinon.match({
        tokens: [TOKEN_1, TOKEN_2],
        tokens_singular: false
      }))
    })
  })
})
