const sinon = require('sinon')

const { ConnectorClient } = require('../../../../app/services/clients/connector.client')
const User = require('../../../../app/models/User.class')
const { validUser } = require('../../../fixtures/user.fixtures')
const { validGatewayAccountsResponse } = require('../../../fixtures/gateway-account.fixtures')
const dashboardRedirectController = require('../../../../app/controllers/stripe-setup/stripe-setup-link/stripe-setup-dashboard-redirect.controller')

describe('Dashboard redirect controller', () => {
  const externalServiceId = 'service-external-id'
  const serviceGatewayAccountIds = ['2', '5']
  let accountSpy, res, req

  beforeEach(() => {
    const user = new User(validUser({
      username: 'valid-user',
      service_roles: [{
        service: {
          external_id: externalServiceId,
          gateway_account_ids: serviceGatewayAccountIds
        }
      }]
    }))

    req = {
      correlationId: 'correlationId',
      params: { externalServiceId },
      user: user
    }

    res = {
      redirect: sinon.spy()
    }
  })
  afterEach(() => accountSpy.restore())

  it('should redirect to live account dashboard if the user has access to the service and there is only one live account', async () => {
    const gatewayAccountResponse = validGatewayAccountsResponse({
      accounts: [{
        gateway_account_id: '2',
        external_id: 'account-2'
      }, {
        gateway_account_id: '5',
        external_id: 'account-5',
        payment_provider: 'stripe',
        type: 'live'
      }]
    })
    accountSpy = sinon.stub(ConnectorClient.prototype, 'getAccounts').callsFake(() => gatewayAccountResponse)

    await dashboardRedirectController(req, res)
    sinon.assert.calledWith(accountSpy, { gatewayAccountIds: ['2', '5'] })
    sinon.assert.calledWith(res.redirect, 302, '/account/account-5/dashboard')
  })

  it('should not request gateway accounts if the user has no access to the service', async () => {
    req.user.serviceRoles[0].service.externalId = 'another-service-id'
    accountSpy = sinon.stub(ConnectorClient.prototype, 'getAccounts')

    await dashboardRedirectController(req, res)
    sinon.assert.neverCalledWith(accountSpy, { gatewayAccountIds: ['6', '10'] })
    sinon.assert.calledWith(res.redirect, 302, '/')
  })

  it('should redirect to the index page if the service has no live accounts', async () => {
    const gatewayAccountResponse = validGatewayAccountsResponse({
      accounts: [{
        gateway_account_id: '2'
      }]
    })
    accountSpy = sinon.stub(ConnectorClient.prototype, 'getAccounts').callsFake(() => gatewayAccountResponse)

    await dashboardRedirectController(req, res)
    sinon.assert.calledWith(accountSpy, { gatewayAccountIds: ['2', '5'] })
    sinon.assert.calledWith(res.redirect, 302, '/')
  })

  it('should redirect to the index page if the service has multiple live accounts', async () => {
    const gatewayAccountResponse = validGatewayAccountsResponse({
      accounts: [{
        gateway_account_id: '2',
        type: 'live'
      }, {
        gateway_account_id: '5',
        type: 'live'
      }]
    })
    accountSpy = sinon.stub(ConnectorClient.prototype, 'getAccounts').callsFake(() => gatewayAccountResponse)

    await dashboardRedirectController(req, res)
    sinon.assert.calledWith(accountSpy, { gatewayAccountIds: ['2', '5'] })
    sinon.assert.calledWith(res.redirect, 302, '/')
  })
})
