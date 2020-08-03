const sinon = require('sinon')
const { expect } = require('chai')

const { ConnectorClient } = require('../../../../app/services/clients/connector.client')
const { validUser } = require('../../../fixtures/user.fixtures')
const { validGatewayAccountsResponse } = require('../../../fixtures/gateway-account.fixtures')
const dashboardRedirectController = require('../../../../app/controllers/stripe-setup/stripe-setup-link/stripe-setup-dashboard-redirect.controller')

describe('Dashboard redirect controller', () => {
  const externalServiceId = 'service-external-id'
  const serviceGatewayAccountIds = [ '2', '5' ]
  let accountSpy, res, req

  beforeEach(() => {
    const user = validUser({
      username: 'valid-user',
      service_roles: [{
        service: {
          external_id: externalServiceId,
          gateway_account_ids: serviceGatewayAccountIds
        }
      }]
    }).getAsObject()

    req = {
      correlationId: 'correlationId',
      params: { externalServiceId },
      gateway_account: { currentGatewayAccountId: '1' },
      user: user
    }

    res = {
      redirect: sinon.spy()
    }
  })
  afterEach(() => accountSpy.restore())

  it('should assign a new current gateway account the user has access to the service and there is only one live account', async () => {
    const gatewayAccountResponse = validGatewayAccountsResponse({
      accounts: [{
        gateway_account_id: '2'
      }, {
        gateway_account_id: '5',
        payment_provider: 'stripe',
        type: 'live'
      }]
    }).getPlain()
    accountSpy = sinon.stub(ConnectorClient.prototype, 'getAccounts').callsFake(() => gatewayAccountResponse)

    await dashboardRedirectController(req, res)
    expect(req.gateway_account.currentGatewayAccountId).to.be.equal('5')
    sinon.assert.calledWith(accountSpy, { gatewayAccountIds: ['2', '5'] })
    sinon.assert.calledWith(res.redirect, 302, '/')
  })

  it('should not request gateway accounts if the user has no access to the service', async () => {
    req.user.serviceRoles[0].service.externalId = 'another-service-id'
    accountSpy = sinon.stub(ConnectorClient.prototype, 'getAccounts')

    await dashboardRedirectController(req, res)
    expect(req.gateway_account.currentGatewayAccountId).to.be.equal('1')
    sinon.assert.neverCalledWith(accountSpy, { gatewayAccountIds: ['6', '10'] })
    sinon.assert.calledWith(res.redirect, 302, '/')
  })

  it('should not set the session gateway account if the service has no live accounts', async () => {
    const gatewayAccountResponse = validGatewayAccountsResponse({
      accounts: [{
        gateway_account_id: '2'
      }]
    }).getPlain()
    accountSpy = sinon.stub(ConnectorClient.prototype, 'getAccounts').callsFake(() => gatewayAccountResponse)

    await dashboardRedirectController(req, res)
    expect(req.gateway_account.currentGatewayAccountId).to.be.equal('1')
    sinon.assert.calledWith(accountSpy, { gatewayAccountIds: ['2', '5'] })
    sinon.assert.calledWith(res.redirect, 302, '/')
  })

  it('should not set the session gateway account if the service has multiple live accounts', async () => {
    const gatewayAccountResponse = validGatewayAccountsResponse({
      accounts: [{
        gateway_account_id: '2',
        type: 'live'
      }, {
        gateway_account_id: '5',
        type: 'live'
      }]
    }).getPlain()
    accountSpy = sinon.stub(ConnectorClient.prototype, 'getAccounts').callsFake(() => gatewayAccountResponse)

    await dashboardRedirectController(req, res)
    expect(req.gateway_account.currentGatewayAccountId).to.be.equal('1')
    sinon.assert.calledWith(accountSpy, { gatewayAccountIds: ['2', '5'] })
    sinon.assert.calledWith(res.redirect, 302, '/')
  })
})
