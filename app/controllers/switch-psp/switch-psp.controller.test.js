const proxyquire = require('proxyquire')
const sinon = require('sinon')

const gatewayAccountFixtures = require('../../../test/fixtures/gateway-account.fixtures')
const userFixtures = require('../../../test/fixtures/user.fixtures')
const User = require('../../models/User.class')

let postAccountSwitchPSPMock = sinon.spy(() => Promise.resolve())
let req, res, next

describe('Verify PSP integration controller', () => {
  describe('for ready to switch accounts', () => {
    beforeEach(() => setupEnvironment('VERIFIED_WITH_LIVE_PAYMENT'))

    it('updates Connector backend and redirects to your psp page', async () => {
      const controller = getControllerWithMocks()
      await controller.submitSwitchPSP(req, res, next)

      sinon.assert.called(postAccountSwitchPSPMock)
      sinon.assert.calledWith(req.flash, 'switchPSPSuccess')
      sinon.assert.calledWith(res.redirect, '/account/a-valid-external-id/your-psp/worldpay')
    })
  })

  describe('for not yet ready to switch accounts', () => {
    beforeEach(() => setupEnvironment('ENTERED'))

    it('stops the session from going through and returns to switch psp page', async () => {
      const controller = getControllerWithMocks()
      await controller.submitSwitchPSP(req, res, next)

      sinon.assert.notCalled(postAccountSwitchPSPMock)
      sinon.assert.calledWith(req.flash, 'genericError', 'You cannot switch providers until all required tasks are completed')
      sinon.assert.calledWith(res.redirect, '/account/a-valid-external-id/switch-psp')
    })
  })
})

function setupEnvironment (switchingCredentialState) {
  const account = gatewayAccountFixtures.validGatewayAccount({
    external_id: 'a-valid-external-id',
    gateway_account_credentials: [
      { state: 'ACTIVE', payment_provider: 'smartpay', id: 100 },
      { state: switchingCredentialState, payment_provider: 'worldpay', id: 200 }
    ]
  })
  req = {
    correlationId: 'correlation-id',
    account: account,
    user: new User(userFixtures.validUserResponse()),
    flash: sinon.spy(),
    session: {}
  }
  res = {
    setHeader: sinon.stub(),
    status: sinon.spy(),
    redirect: sinon.spy(),
    render: sinon.spy()
  }
  next = sinon.spy()

  postAccountSwitchPSPMock.resetHistory()
}

function getControllerWithMocks () {
  return proxyquire('./switch-psp.controller', {
    '../../services/clients/connector.client': {
      ConnectorClient: function () {
        this.postAccountSwitchPSP = postAccountSwitchPSPMock
      }
    }
  })
}
