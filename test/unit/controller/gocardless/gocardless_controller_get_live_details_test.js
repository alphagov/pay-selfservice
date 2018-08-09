'use strict'

const controller = require('../../../../app/controllers/direct_debit/gocardless_oauth_controller')
const baseClient = require('../../../../app/services/clients/base_client/base_client')
const directDebitClient = require('../../../../app/services/clients/direct_debit_connector_client')
const gocardlessClient = require('../../../../app/services/clients/gocardless_client')

const {expect} = require('chai')
const sinon = require('sinon')

let req, res, stubbedBaseClientPost, stubbedBaseClientPatch, stubbedGetGatewayAccount

describe('When GoCardless Controller receives a GET request for live account', function () {
  beforeEach(function () {
    req = {
      correlationId: 'some-correlation-id',
      account: {
        type: 'live'
      },
      query: {
        state: 'a-csrf-token.123',
        code: 'a-test-code'
      }
    }

    res = {
      end: () => {
        expect(true).to.equal(true)
      },
      status: (code) => {
        expect(code).to.equal(200)
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

    stubbedGetGatewayAccount = directDebitClient.gatewayAccount.get = sinon.stub()
    stubbedGetGatewayAccount.resolves({
      type: 'live'
    })
  })

  afterEach(() => {
    stubbedBaseClientPost.reset()
    stubbedBaseClientPatch.reset()
    stubbedGetGatewayAccount.reset()
  })

  it('returns LIVE GoCardless variables', () => {
    gocardlessClient.postOAuthToken = (params) => {
      expect(params.clientId).to.equal(process.env.GOCARDLESS_LIVE_CLIENT_ID)
      expect(params.clientSecret).to.equal(process.env.GOCARDLESS_LIVE_CLIENT_SECRET)
      expect(params.gocardlessUrl).to.equal(process.env.GOCARDLESS_LIVE_OAUTH_BASE_URL)

      return new Promise(resolve => {
      })
    }
    controller.oauthCompleteGet(req, res)
  })
})
