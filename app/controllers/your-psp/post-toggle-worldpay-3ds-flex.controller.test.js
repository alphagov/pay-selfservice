'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const paths = require('../../paths')

describe('Toggle Worldpay 3DS Flex controller', () => {
  let req
  let res
  let updateIntegrationVersion3dsMock
  let renderErrorViewMock

  beforeEach(() => {
    req = {
      correlationId: 'correlation-id',
      account: {
        gateway_account_id: '1'
      },
      flash: sinon.spy(),
      body: {}
    }
    res = {
      setHeader: sinon.stub(),
      status: sinon.spy(),
      redirect: sinon.spy(),
      render: sinon.spy()
    }
  })

  it('should toggle 3DS Flex on by setting 3DS integration version to 2', async () => {
    updateIntegrationVersion3dsMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    req.body['toggle-worldpay-3ds-flex'] = 'on'
    await controller(req, res)

    sinon.assert.calledWith(updateIntegrationVersion3dsMock, req.account.gateway_account_id, 2, req.correlationId)
    sinon.assert.calledWith(req.flash, 'generic', '3DS Flex has been turned on.')
    sinon.assert.calledWith(res.redirect, 303, paths.yourPsp.index)
  })

  it('should toggle 3DS Flex off by setting 3DS integration version to 1', async () => {
    updateIntegrationVersion3dsMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    req.body['toggle-worldpay-3ds-flex'] = 'off'
    await controller(req, res)

    sinon.assert.calledWith(updateIntegrationVersion3dsMock, req.account.gateway_account_id, 1, req.correlationId)
    sinon.assert.calledWith(req.flash, 'generic', '3DS Flex has been turned off. Your payments will now use 3DS only.')
    sinon.assert.calledWith(res.redirect, 303, paths.yourPsp.index)
  })

  it('should render an error if problem calling connector', async () => {
    const error = new Error()
    updateIntegrationVersion3dsMock = sinon.spy(() => Promise.reject(error))
    renderErrorViewMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    req.body['toggle-worldpay-3ds-flex'] = 'on'
    await controller(req, res)

    sinon.assert.calledWith(updateIntegrationVersion3dsMock, req.account.gateway_account_id, 2, req.correlationId)
    sinon.assert.calledWith(renderErrorViewMock, req, res, false, error.errorCode)

    sinon.assert.notCalled(req.flash)
    sinon.assert.notCalled(res.redirect)
  })

  it('should render an error if an invalid value is provided', async () => {
    updateIntegrationVersion3dsMock = sinon.spy(() => Promise.reject(new Error()))
    renderErrorViewMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    req.body['toggle-worldpay-3ds-flex'] = 'oof'
    await controller(req, res)

    sinon.assert.calledWith(renderErrorViewMock, req, res, false, 400)

    sinon.assert.notCalled(updateIntegrationVersion3dsMock)
    sinon.assert.notCalled(req.flash)
    sinon.assert.notCalled(res.redirect)
  })

  it('should render an error if no value is provided', async () => {
    updateIntegrationVersion3dsMock = sinon.spy(() => Promise.reject(new Error()))
    renderErrorViewMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    await controller(req, res)

    sinon.assert.calledWith(renderErrorViewMock, req, res, false, 400)

    sinon.assert.notCalled(updateIntegrationVersion3dsMock)
    sinon.assert.notCalled(req.flash)
    sinon.assert.notCalled(res.redirect)
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
