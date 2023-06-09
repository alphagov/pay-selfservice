'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')

const gatewayAccountFixtures = require('../../../test/fixtures/gateway-account.fixtures')

describe('Post 3DS Flex controller', () => {
  const gatewayAccountExternalId = 'a-gateway-account-external-id'
  const credentialId = 'a-valid-credential-id'
  let req
  let res
  let next
  let postCheckWorldpay3dsFlexCredentials
  let post3dsFlexAccountCredentials
  let updateIntegrationVersion3dsMock
  let renderErrorViewMock

  beforeEach(() => {
    req = {
      params: { credentialId },
      flash: sinon.spy(),
      body: {
        'organisational-unit-id': '111111111111111111111111',
        issuer: '111111111111111111111111',
        'jwt-mac-key': '11111111-1111-1111-1111-111111111111'
      }
    }
    res = {
      setHeader: sinon.stub(),
      status: sinon.spy(),
      redirect: sinon.spy(),
      render: sinon.spy()
    }

    next = sinon.spy()

    postCheckWorldpay3dsFlexCredentials = sinon.spy(() => Promise.resolve({ result: 'valid' }))
    post3dsFlexAccountCredentials = sinon.spy(() => Promise.resolve())
    updateIntegrationVersion3dsMock = sinon.spy(() => Promise.resolve())
  })

  it('should set 3DS integration version to 2 for LIVE account', async () => {
    req.account = getGatewayAcountWithType('live')

    const controller = getControllerWithMocks()

    await controller(req, res, next)

    sinon.assert.calledWith(updateIntegrationVersion3dsMock, req.account.gateway_account_id, 2)
    sinon.assert.calledWith(req.flash, 'generic', 'Your Worldpay 3DS Flex settings have been updated')
    sinon.assert.calledWith(res.redirect, `/account/${gatewayAccountExternalId}/your-psp/${credentialId}`)
  })

  it('should NOT set 3DS integration version to 2 for TEST account', async () => {
    req.account = getGatewayAcountWithType('test')

    const controller = getControllerWithMocks()

    await controller(req, res, next)

    sinon.assert.notCalled(updateIntegrationVersion3dsMock)
  })

  it('should call next when there is an error updating the 3DS integration version to 2', async () => {
    req.account = getGatewayAcountWithType('live')
    const expectedError = new Error('error from adminusers')

    updateIntegrationVersion3dsMock = sinon.stub().rejects(expectedError)
    const controller = getControllerWithMocks()

    await controller(req, res, next)

    sinon.assert.calledWith(updateIntegrationVersion3dsMock, req.account.gateway_account_id, 2)
    sinon.assert.calledWith(next, expectedError)
  })

  it('should redirect to the `switch psp` index page when on the `switch psp` route', async () => {
    req.account = getGatewayAcountWithType('live')
    req.url = `/switch-psp/${credentialId}/flex`

    const controller = getControllerWithMocks()

    await controller(req, res, next)

    sinon.assert.calledWith(updateIntegrationVersion3dsMock, req.account.gateway_account_id, 2)
    sinon.assert.calledWith(req.flash, 'generic', 'Your Worldpay 3DS Flex settings have been updated')
    sinon.assert.calledWith(res.redirect, `/account/${gatewayAccountExternalId}/switch-psp`)
  })

  function getControllerWithMocks () {
    return proxyquire('./post-flex.controller', {
      '../../services/clients/connector.client': {
        ConnectorClient: function () {
          this.postCheckWorldpay3dsFlexCredentials = postCheckWorldpay3dsFlexCredentials
          this.post3dsFlexAccountCredentials = post3dsFlexAccountCredentials
          this.updateIntegrationVersion3ds = updateIntegrationVersion3dsMock
        }
      },
      '../../utils/response': {
        renderErrorView: renderErrorViewMock
      }
    })
  }

  function getGatewayAcountWithType (accountType) {
    return gatewayAccountFixtures.validGatewayAccount({
      gateway_account_id: '1',
      type: accountType,
      external_id: gatewayAccountExternalId,
      gateway_account_credentials: [{
        payment_provider: 'worldpay',
        external_id: credentialId
      }]
    })
  }
})
