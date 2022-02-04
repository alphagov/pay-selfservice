const proxyquire = require('proxyquire')
const sinon = require('sinon')

const gatewayAccountFixtures = require('../../../fixtures/gateway-account.fixtures')
const userFixtures = require('../../../fixtures/user.fixtures')
const User = require('../../../../app/models/User.class')

const checkCredentialsMock = sinon.spy(() => Promise.resolve({ result: 'valid' }))
const updateCredentialsMock = sinon.spy(() => Promise.resolve())

describe('Worldpay credentials controller', () => {
  let req
  let res
  let next

  beforeEach(() => {
    const account = gatewayAccountFixtures.validGatewayAccount({
      external_id: 'a-valid-external-id',
      gateway_account_credentials: [
        { state: 'ACTIVE', payment_provider: 'smartpay', id: 100, external_id: 'a-valid-credential-id-smartpay' },
        { state: 'CREATED', payment_provider: 'worldpay', id: 200, external_id: 'a-valid-credential-id-worldpay' }
      ]
    })
    req = {
      correlationId: 'correlation-id',
      account: account,
      user: new User(userFixtures.validUserResponse()),
      body: {
        merchantId: 'a-merchant-id',
        username: 'a-username',
        password: 'a-password' // pragma: allowlist secret
      },
      flash: sinon.spy(),
      route: {
        path: '/your-psp/:credentialId/credentials-with-gateway-check'
      },
      params: { credentialId: 'a-valid-credential-id-smartpay' },
      headers: {
        'x-request-id': 'correlation-id'
      }
    }
    res = {
      setHeader: sinon.stub(),
      status: sinon.spy(),
      redirect: sinon.spy(),
      render: sinon.spy()
    }
    next = sinon.spy()

    checkCredentialsMock.resetHistory()
    updateCredentialsMock.resetHistory()
  })

  it('should call connector to patch credentials', async () => {
    const controller = getControllerWithMocks()

    req.route.path = '/switch-psp/:credentialId/credentials-with-gateway-check'
    await controller.updateWorldpayCredentials(req, res, next)

    sinon.assert.called(checkCredentialsMock)
    sinon.assert.called(updateCredentialsMock)
    sinon.assert.calledWith(res.redirect, 303, '/account/a-valid-external-id/switch-psp')
  })
})

function getControllerWithMocks () {
  return proxyquire('../../../../app/controllers/credentials/worldpay.controller', {
    '../../services/clients/connector.client': {
      ConnectorClient: function () {
        this.postCheckWorldpayCredentials = checkCredentialsMock
        this.patchAccountGatewayAccountCredentials = updateCredentialsMock
      }
    }
  })
}
