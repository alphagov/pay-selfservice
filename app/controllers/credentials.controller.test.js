const proxyquire = require('proxyquire')
const sinon = require('sinon')
const gatewayAccountFixture = require('../../test/fixtures/gateway-account.fixtures')
const patchAccountSpy = sinon.spy(() => Promise.resolve())
const postNotificationCredentialsSpy = sinon.spy(() => Promise.resolve())
const connectorClientMock = {
  ConnectorClient: function () {
    this.patchAccountGatewayAccountCredentials = patchAccountSpy
    this.postAccountNotificationCredentials = postNotificationCredentialsSpy
  }
}
const credentialsController = proxyquire('./credentials.controller', { '../services/clients/connector.client': connectorClientMock })

// @TODO(sfount) there should be a common pattern of helpers for quickly unit
//               testing controllers with values that work out of the box
const expressResponseStub = {
  setHeader: sinon.stub(),
  status: sinon.spy(),
  redirect: sinon.spy(),
  render: sinon.spy()
}
const next = sinon.spy()
const credentialId = 'a-valid-credential-id'
describe('gateway credentials controller', () => {
  beforeEach(() => {
    patchAccountSpy.resetHistory()
  })
  it('should remove leading and trailing whitespace from credentials when submitting them to the backend', async () => {
    const req = {
      body: {
        username: ' username       ',
        password: ' password ',
        merchantId: ' merchant-id '
      },
      user: { externalId: 'some-id' },
      account: gatewayAccountFixture.validGatewayAccount({
        gateway_account_credentials: [{
          external_id: credentialId
        }]
      }),
      params: { credentialId },
      headers: {}
    }
    await credentialsController.update(req, expressResponseStub, next)
    sinon.assert.calledWithMatch(patchAccountSpy, { credentials: { username: 'username', password: 'password', merchant_id: 'merchant-id' } })
  })

  it('should remove leading and trailing whitespace from notification credentials when submitting them to the backend', async () => {
    const req = {
      body: {
        username: ' username       ',
        password: ' password123 '
      },
      account: gatewayAccountFixture.validGatewayAccount({
        gateway_account_credentials: [{
          external_id: credentialId
        }]
      }),
      params: { credentialId },
      headers: {},
      flash: sinon.spy()
    }
    await credentialsController.updateNotificationCredentials(req, expressResponseStub, next)
    sinon.assert.calledWithMatch(postNotificationCredentialsSpy, { payload: { username: 'username', password: 'password123' } }) // pragma: allowlist secret
  })
})
