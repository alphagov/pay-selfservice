const sinon = require('sinon')
const { expect } = require('chai')
const proxyquire = require('proxyquire')

const { ConnectorClient } = require('../../../../app/services/clients/connector_client')

const dashboardRedirectController = require('../../../../app/controllers/stripe-setup/stripe-setup-link/stripe_setup_dashboard_redirect_controller')

const { validUser } = require('../../../fixtures/user_fixtures')
const { validGatewayAccountsResponse } = require('../../../fixtures/gateway_account_fixtures')

describe('Dashboard redirect controller', () => {
  const externalServiceId = 'service-external-id'
  const serviceGatewayAccountIds = ['2', '5']
  let accountSpy, res, req

  beforeEach(() => {
    req = {}
    req.correlationId = 'correlationId'
    req.params = {
      externalServiceId
    }
    req.gateway_account = {
      currentGatewayAccountId: '1'
    }
    req.user = validUser({
      username: 'bob',
      service_roles: [
        {
          service: {
            name: 'My Service 1',
            external_id: externalServiceId,
            gateway_account_ids: serviceGatewayAccountIds
          },
          role: {
            name: 'admin',
            permissions: [{ name: 'blah-blah:blah' }]
          }
        }]
    }).getAsObject()

    res = {
      redirect: sinon.spy()
    }
  })
  afterEach(() => accountSpy.restore())

  it('should assign a new current gateway account the user has access to the service and there is only one live account', async () => {
    const gatewayAccountResponse = validGatewayAccountsResponse({
      accounts: [
        {
          gateway_account_id: '2'
        },
        {
          gateway_account_id: '5',
          payment_provider: 'stripe',
          type: 'live'
        }
      ]
    }).getPlain()
    proxyquire('../../../../app/controllers/stripe-setup/stripe-setup-link/stripe_setup_dashboard_redirect_controller', {
      '../../../services/clients/connector_client': {
        ConnectorClient: class {
          async getAccounts () {
            return gatewayAccountResponse
          }
        }
      } })

    accountSpy = sinon.stub(ConnectorClient.prototype, 'getAccounts').callsFake(async () => {
      return gatewayAccountResponse
    })
    await dashboardRedirectController(req, res)
    expect(req.gateway_account.currentGatewayAccountId).to.be.equal('5')
    sinon.assert.calledWith(accountSpy, ['2', '5'])
    sinon.assert.calledWith(res.redirect, 302, '/')
  })

  it('should not request gateway accounts if the user has no access to the service', async () => {
    req.user.serviceRoles[0].service.externalId = 'another-service-id'
    accountSpy = sinon.stub(ConnectorClient.prototype, 'getAccounts')

    await dashboardRedirectController(req, res)
    expect(req.gateway_account.currentGatewayAccountId).to.be.equal('1')
    sinon.assert.neverCalledWith(accountSpy, ['6', '10'])
    sinon.assert.calledWith(res.redirect, 302, '/')
  })

  it('should not set the session gateway account if the service has no live accounts', async () => {
    const gatewayAccountResponse = validGatewayAccountsResponse({
      accounts: [
        {
          gateway_account_id: '2'
        },
        {
          gateway_account_id: '5',
          payment_provider: 'stripe'
        }
      ]
    }).getPlain()
    proxyquire('../../../../app/controllers/stripe-setup/stripe-setup-link/stripe_setup_dashboard_redirect_controller', {
      '../../../services/clients/connector_client': {
        ConnectorClient: class {
          async getAccounts () {
            return { gatewayAccountResponse }
          }
        }
      } })

    accountSpy = sinon.stub(ConnectorClient.prototype, 'getAccounts').callsFake(async () => {
      return gatewayAccountResponse
    })
    await dashboardRedirectController(req, res)
    expect(req.gateway_account.currentGatewayAccountId).to.be.equal('1')
    sinon.assert.calledWith(accountSpy, ['2', '5'])
    sinon.assert.calledWith(res.redirect, 302, '/')
  })

  it('should not set the session gateway account if the service has multiple live accounts', async () => {
    const gatewayAccountResponse = validGatewayAccountsResponse({
      accounts: [
        {
          gateway_account_id: '2',
          payment_provider: 'stripe',
          type: 'live'
        },
        {
          gateway_account_id: '5',
          payment_provider: 'stripe',
          type: 'live'
        }
      ]
    }).getPlain()
    proxyquire('../../../../app/controllers/stripe-setup/stripe-setup-link/stripe_setup_dashboard_redirect_controller', {
      '../../../services/clients/connector_client': {
        ConnectorClient: class {
          async getAccounts () {
            return gatewayAccountResponse
          }
        }
      } })

    accountSpy = sinon.stub(ConnectorClient.prototype, 'getAccounts').callsFake(async () => {
      return gatewayAccountResponse
    })
    await dashboardRedirectController(req, res)
    expect(req.gateway_account.currentGatewayAccountId).to.be.equal('1')
    sinon.assert.calledWith(accountSpy, ['2', '5'])
    sinon.assert.calledWith(res.redirect, 302, '/')
  })
})
