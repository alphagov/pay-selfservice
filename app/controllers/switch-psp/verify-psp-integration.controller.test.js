const proxyquire = require('proxyquire')
const sinon = require('sinon')

const gatewayAccountFixtures = require('../../../test/fixtures/gateway-account.fixtures')
const connectorChargeFixtures = require('../../../test/fixtures/connector-charge.fixtures')
const userFixtures = require('../../../test/fixtures/user.fixtures')
const User = require('../../models/User.class')
const { expect } = require('chai')

const defaultCharge = connectorChargeFixtures.validChargeResponse()
let postChargeRequestMock = sinon.spy(() => Promise.resolve(defaultCharge))
let patchAccountGatewayAccountCredentialsStateMock = sinon.spy(() => Promise.resolve())
let getChargeMock = sinon.spy(() => Promise.resolve(defaultCharge))

describe('Verify PSP integration controller', () => {
  let req, res, next

  beforeEach(() => {
    const account = gatewayAccountFixtures.validGatewayAccount({
      external_id: 'a-valid-external-id',
      gateway_account_credentials: [
        { state: 'ACTIVE', payment_provider: 'smartpay', id: 100 },
        { state: 'CREATED', payment_provider: 'worldpay', id: 200 }
      ]
    })
    req = {
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

    postChargeRequestMock.resetHistory()
    patchAccountGatewayAccountCredentialsStateMock.resetHistory()
    getChargeMock.resetHistory()
  })

  it('sets up the session correctly and redirects to the charge nexturl to start the payment journey', async () => {
    const controller = getControllerWithMocks()
    const nextUrl = defaultCharge.links.filter((link) => link.rel === 'next_url')[0].href
    await controller.startPaymentJourney(req, res, next)

    sinon.assert.calledWith(postChargeRequestMock, 31, {
      amount: 200,
      description: 'Live payment to verify new PSP',
      reference: 'VERIFY_PSP_INTEGRATION',
      return_url: 'https://selfservice.pymnt.localdomain/account/a-valid-external-id/switch-psp/verify-psp-integration/callback',
      credential_id: 'a-valid-external-id'
    })

    expect(req.session.verify_psp_integration_charge_external_id).to.equal(defaultCharge.charge_id)
    sinon.assert.calledWith(res.redirect, nextUrl)
  })

  it('configures the session correctly and redirects to the charge nexturl to start the payment journey', async () => {
    const controller = getControllerWithMocks()
    const nextUrl = defaultCharge.links.filter((link) => link.rel === 'next_url')[0].href
    await controller.startPaymentJourney(req, res, next)

    sinon.assert.called(postChargeRequestMock)
    expect(req.session.verify_psp_integration_charge_external_id).to.equal(defaultCharge.charge_id)
    sinon.assert.calledWith(res.redirect, nextUrl)
  })

  it('configures the session and redirects when the test payment was successful', async () => {
    const charge = connectorChargeFixtures.validChargeResponse({ status: 'success' })
    getChargeMock = sinon.spy(() => Promise.resolve(charge))
    req.session.verify_psp_integration_charge_external_id = charge.charge_id
    const controller = getControllerWithMocks()
    await controller.completePaymentJourney(req, res, next)

    sinon.assert.called(getChargeMock)
    sinon.assert.called(patchAccountGatewayAccountCredentialsStateMock)
    sinon.assert.calledWith(req.flash, 'verifyIntegrationPaymentSuccess', true)
    sinon.assert.calledWith(res.redirect, '/account/a-valid-external-id/switch-psp')
  })

  it('configures the session and redirects when the test payment was unsuccessful', async () => {
    const charge = connectorChargeFixtures.validChargeResponse({ status: 'cancelled' })
    getChargeMock = sinon.spy(() => Promise.resolve(charge))
    req.session.verify_psp_integration_charge_external_id = charge.charge_id
    const controller = getControllerWithMocks()
    await controller.completePaymentJourney(req, res, next)

    sinon.assert.called(getChargeMock)
    sinon.assert.notCalled(patchAccountGatewayAccountCredentialsStateMock)
    sinon.assert.calledWith(req.flash, 'verifyIntegrationPaymentFailed', true)
    sinon.assert.calledWith(res.redirect, '/account/a-valid-external-id/switch-psp/verify-psp-integration')
  })
})

function getControllerWithMocks () {
  return proxyquire('./verify-psp-integration.controller', {
    '../../services/clients/connector.client': {
      ConnectorClient: function () {
        this.postChargeRequest = postChargeRequestMock
        this.patchAccountGatewayAccountCredentialsState = patchAccountGatewayAccountCredentialsStateMock
        this.getCharge = getChargeMock
      }
    }
  })
}
