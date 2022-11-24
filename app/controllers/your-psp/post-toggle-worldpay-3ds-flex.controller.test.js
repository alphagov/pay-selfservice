'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')

const gatewayAccountFixtures = require('../../../test/fixtures/gateway-account.fixtures')

describe('Toggle Worldpay 3DS Flex controller', () => {
  const gatewayAccountExternalId = 'a-gateway-account-external-id'
  const credentialId = 'a-valid-credential-id'
  let req
  let res
  let next
  let updateIntegrationVersion3dsMock
  let renderErrorViewMock

  beforeEach(() => {
    req = {
      account: gatewayAccountFixtures.validGatewayAccount({
        gateway_account_id: '1',
        external_id: gatewayAccountExternalId,
        gateway_account_credentials: [{
          payment_provider: 'worldpay',
          external_id: credentialId
        }],
        type: 'test'
      }),
      params: { credentialId },
      flash: sinon.spy(),
      body: {}
    }
    res = {
      setHeader: sinon.stub(),
      status: sinon.spy(),
      redirect: sinon.spy(),
      render: sinon.spy()
    }
    next = sinon.spy()
  })

  describe('Test gateway account', () => {
    it('should toggle 3DS Flex on by setting 3DS integration version to 2', async () => {
      updateIntegrationVersion3dsMock = sinon.spy(() => Promise.resolve())
      const controller = getControllerWithMocks()

      req.body['toggle-worldpay-3ds-flex'] = 'on'
      await controller(req, res, next)

      sinon.assert.calledWith(updateIntegrationVersion3dsMock, req.account.gateway_account_id, 2)
      sinon.assert.calledWith(req.flash, 'generic', '3DS Flex has been turned on.')
      sinon.assert.calledWith(res.redirect, 303, `/account/${gatewayAccountExternalId}/your-psp/${credentialId}`)
    })

    it('should toggle 3DS Flex off by setting 3DS integration version to 1', async () => {
      updateIntegrationVersion3dsMock = sinon.spy(() => Promise.resolve())
      const controller = getControllerWithMocks()

      req.body['toggle-worldpay-3ds-flex'] = 'off'
      await controller(req, res, next)

      sinon.assert.calledWith(updateIntegrationVersion3dsMock, req.account.gateway_account_id, 1)
      sinon.assert.calledWith(req.flash, 'generic', '3DS Flex has been turned off. Your payments will now use 3DS only.')
      sinon.assert.calledWith(res.redirect, 303, `/account/${gatewayAccountExternalId}/your-psp/${credentialId}`)
    })

    it('should call next with error if problem calling connector', async () => {
      const error = new Error()
      updateIntegrationVersion3dsMock = sinon.spy(() => Promise.reject(error))
      renderErrorViewMock = sinon.spy(() => Promise.resolve())
      const controller = getControllerWithMocks()

      req.body['toggle-worldpay-3ds-flex'] = 'on'
      await controller(req, res, next)

      sinon.assert.calledWith(updateIntegrationVersion3dsMock, req.account.gateway_account_id, 2)
      const expectedError = sinon.match.instanceOf(Error)
      sinon.assert.calledWith(next, expectedError)

      sinon.assert.notCalled(req.flash)
      sinon.assert.notCalled(res.redirect)
    })

    it('should render an error if an invalid value is provided', async () => {
      updateIntegrationVersion3dsMock = sinon.spy(() => Promise.reject(new Error()))
      renderErrorViewMock = sinon.spy(() => Promise.resolve())
      const controller = getControllerWithMocks()

      req.body['toggle-worldpay-3ds-flex'] = 'oof'
      await controller(req, res, next)

      sinon.assert.calledWith(renderErrorViewMock, req, res, false, 400)

      sinon.assert.notCalled(updateIntegrationVersion3dsMock)
      sinon.assert.notCalled(req.flash)
      sinon.assert.notCalled(res.redirect)
    })

    it('should render an error if no value is provided', async () => {
      updateIntegrationVersion3dsMock = sinon.spy(() => Promise.reject(new Error()))
      renderErrorViewMock = sinon.spy(() => Promise.resolve())
      const controller = getControllerWithMocks()

      await controller(req, res, next)

      sinon.assert.calledWith(renderErrorViewMock, req, res, false, 400)

      sinon.assert.notCalled(updateIntegrationVersion3dsMock)
      sinon.assert.notCalled(req.flash)
      sinon.assert.notCalled(res.redirect)
    })
  })

  describe('Live gateway account', () => {
    it('should call next with error if trying to toggle 3DS on a live gateway account', async () => {
      req.account.type = 'live'

      updateIntegrationVersion3dsMock = sinon.spy(() => Promise.resolve())
      const controller = getControllerWithMocks()

      req.body['toggle-worldpay-3ds-flex'] = 'on'
      await controller(req, res, next)

      const expectedError = sinon.match.instanceOf(Error)
        .and(sinon.match.has('message', `Cannot toggle Worldpay 3DS flex for live gateway account: ${req.account.external_id}`))
      sinon.assert.calledWith(next, expectedError)
    })
  })

  function getControllerWithMocks () {
    return proxyquire('./post-toggle-worldpay-3ds-flex.controller', {
      '../../services/clients/connector.client': {
        ConnectorClient: function () {
          this.updateIntegrationVersion3ds = updateIntegrationVersion3dsMock
        }
      },
      '../../utils/response': {
        renderErrorView: renderErrorViewMock
      }
    })
  }
})
