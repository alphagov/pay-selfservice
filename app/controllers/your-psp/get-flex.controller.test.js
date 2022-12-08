'use strict'

const sinon = require('sinon')
const getController = require('./get-flex.controller')
const gatewayAccountFixtures = require('../../../test/fixtures/gateway-account.fixtures')
const { expect } = require('chai')
const credentialId = 'a-valid-credential-id'

describe('Flex credentials - GET controller', () => {
  let req
  let res
  let next
  const account = gatewayAccountFixtures.validGatewayAccount({
    gateway_account_credentials: [
      {
        state: 'ACTIVE',
        payment_provider: 'worldpay',
        id: 100,
        external_id: credentialId
      }
    ]
  })

  beforeEach(() => {
    req = {
      account: account,
      params: { credentialId },
      url: `/switch-psp/${credentialId}/flex`
    }
    res = {
      redirect: sinon.spy(),
      render: sinon.spy()
    }
    next = sinon.spy()
  })

  it('should set isSwitchingCredentials = true and pass it to the page data', async () => {
    await getController(req, res, next)

    const pageData = res.render.args[0][1]
    expect(pageData.isSwitchingCredentials).to.equal(true)
    sinon.assert.calledWith(res.render, 'your-psp/flex')
  })
})
