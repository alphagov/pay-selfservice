const proxyquire = require('proxyquire')
const sinon = require('sinon')

const spy = sinon.spy(() => Promise.resolve())
const connectorClientMock = {
  ConnectorClient: function () {
    this.patchAccountCredentials = spy
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
describe('gateway credentials controller', () => {
  it('should remove leading and trailing whitespace from credentials when submitting them to the backend', async () => {
    const req = {
      body: {
        username: ' username       ',
        password: ' password ',
        merchantId: ' merchant-id '
      },
      account: {},
      headers: {}
    }
    await credentialsController.update(req, expressResponseStub)
    sinon.assert.calledWithMatch(spy, { payload: { credentials: { username: 'username', password: 'password', merchant_id: 'merchant-id' } } })
  })
})
