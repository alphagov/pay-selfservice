'use strict'

const path = require('path')
const proxyquire = require('proxyquire')
const sinon = require('sinon')
const { expect } = require('chai')
const User = require('../../../app/models/User.class')
const userFixtures = require('../../fixtures/user.fixtures')
const stripeAccountSetupFixture = require('../../fixtures/stripe-account-setup.fixtures')

let req, res, next, connectorGetAccountMock, connectorGetStripeAccountSetupMock

const connectorMock = {
  ConnectorClient: function () {
    this.getAccountByExternalId = connectorGetAccountMock
    this.getStripeAccountSetup = connectorGetStripeAccountSetupMock
  }
}

const buildUser = (serviceExternalId, gatewayAccountIds) => {
  return new User(userFixtures.validUserResponse({
    service_roles: [{
      service: {
        external_id: serviceExternalId,
        gateway_account_ids: gatewayAccountIds
      }
    }]
  }))
}

const setupGetGatewayAccountAndService = function (gatewayAccountID, gatewayAccountExternalId, paymentProvider, serviceExternalId) {
  req = {
    params: { gatewayAccountExternalId: gatewayAccountExternalId, serviceExternalId: serviceExternalId },
    correlationId: 'some-correlation-id'
  }
  req.user = buildUser(serviceExternalId, [`${gatewayAccountID}`])
  next = sinon.spy()
  connectorGetAccountMock = sinon.spy((params) => {
    return Promise.resolve({
      gateway_account_id: gatewayAccountID,
      external_id: gatewayAccountExternalId,
      payment_provider: paymentProvider
    })
  })

  if (paymentProvider === 'stripe') {
    connectorGetStripeAccountSetupMock = sinon.spy((params) => {
      return Promise.resolve(stripeAccountSetupFixture.buildGetStripeAccountSetupResponse())
    })
  }

  return proxyquire(path.join(__dirname, '../../../app/middleware/get-service-and-gateway-account.middleware'), {
    '../services/clients/connector.client.js': connectorMock
  })
}
const setupGetGatewayAccountClientError = function (gatewayAccountExternalId, errorCode) {
  req = {
    params: { gatewayAccountExternalId: gatewayAccountExternalId },
    correlationId: 'some-correlation-id'
  }
  next = sinon.spy()
  connectorGetAccountMock = sinon.spy((params) => {
    const errorFromConnector = { errorCode: errorCode }
    return Promise.reject(errorFromConnector)
  })

  return proxyquire(path.join(__dirname, '../../../app/middleware/get-service-and-gateway-account.middleware'), {
    '../services/clients/connector.client.js': connectorMock
  })
}

describe('middleware: getGatewayAccountAndService', () => {
  it('should set gateway account and service on request object ', async () => {
    const getGatewayAccountAndService = setupGetGatewayAccountAndService(1, 'some-gateway-external-id', 'worldpay', 'some-service-external-id')

    await getGatewayAccountAndService(req, res, next)

    sinon.assert.calledOnce(next)
    expect(connectorGetAccountMock.called).to.equal(true)
    expect(connectorGetAccountMock.calledWith({
      gatewayAccountExternalId: 'some-gateway-external-id',
      correlationId: 'some-correlation-id'
    })).to.equal(true)

    expect(req.account.external_id).to.equal('some-gateway-external-id')
    expect(req.service.externalId).to.equal('some-service-external-id')

    expect(req.gateway_account.currentGatewayAccountExternalId).to.equal('some-gateway-external-id')
  })
  it('should error, if both gateway account external ID and service external ID cannot be resolved', async () => {
    const getGatewayAccountAndService = setupGetGatewayAccountAndService(1, 'some-gateway-external-id', 'worldpay', 'some-service-external-id')
    req.params['gatewayAccountExternalId'] = undefined
    req.params['serviceExternalId'] = undefined

    await getGatewayAccountAndService(req, res, next)

    const expectedError = sinon.match.instanceOf(Error)
      .and(sinon.match.has('message', 'Could not resolve gateway account external ID or service external ID from request params'))
    sinon.assert.calledWith(next, expectedError)
  })
  it('should continue without setting gateway account, if gateway account external ID is not resolved', async () => {
    const getGatewayAccountAndService = setupGetGatewayAccountAndService(1, 'some-gateway-external-id', 'worldpay', 'some-service-external-id')
    req.params['gatewayAccountExternalId'] = undefined

    await getGatewayAccountAndService(req, res, next)

    sinon.assert.calledOnce(next)

    expect(req).to.not.have.property('account')
    expect(req).to.not.have.property('gateway_account')

    expect(req.service.externalId).to.equal('some-service-external-id')
  })
  it('should continue without setting gateway account, if connector returns error', async () => {
    const getGatewayAccountAndService = setupGetGatewayAccountClientError('some-gateway-account-external-id', 500)

    await getGatewayAccountAndService(req, res, next)
    sinon.assert.calledOnce(next)
    expect(req.account).to.be.undefined // eslint-disable-line
  })
  it('should set service based on gateway account, when serviceExternalId cannot be resolved', async () => {
    const getGatewayAccountAndService = setupGetGatewayAccountAndService(1, 'some-gateway-external-id', 'worldpay', 'some-service-external-id')
    req.params['serviceExternalId'] = undefined

    await getGatewayAccountAndService(req, res, next)
    sinon.assert.calledOnce(next)
    expect(req.service.externalId).to.equal('some-service-external-id')
  })
  it('should continue without setting service on request, when service cannot be resolved for serviceExternalId or gateway account (if available)', async () => {
    const getGatewayAccountAndService = setupGetGatewayAccountAndService(1, 'some-gateway-external-id', 'worldpay', 'some-service-external-id')
    req.params['serviceExternalId'] = 'non-existent-service'

    await getGatewayAccountAndService(req, res, next)
    sinon.assert.calledOnce(next)
    expect(req.service).to.be.undefined // eslint-disable-line
  })
  it('should continue without setting service or gateway account, if user is not available on req object', async () => {
    const getGatewayAccountAndService = setupGetGatewayAccountAndService(1, 'some-gateway-external-id', 'worldpay', 'some-service-external-id')
    req.user = undefined

    await getGatewayAccountAndService(req, res, next)
    sinon.assert.calledOnce(next)
    expect(req.service).to.be.undefined // eslint-disable-line
    expect(req.account).to.be.undefined // eslint-disable-line
  })
  describe('extend gateway account data with disableToggle3ds field', () => {
    ['worldpay', 'smartpay', 'epdq'].forEach(function (value) {
      it('should extend the account data with disableToggle3ds set to false if account type is ' + value, async () => {
        const getGatewayAccountAndService = setupGetGatewayAccountAndService(1, 'some-gateway-external-id', value, 'some-service-external-id')

        await getGatewayAccountAndService(req, res, next)
        expect(req.account.disableToggle3ds).to.equal(false)
        expect(req.account.external_id).to.equal('some-gateway-external-id')
      })
    })
    it('should extend the account data with disableToggle3ds set to true if account type is stripe', async () => {
      const getGatewayAccountAndService = setupGetGatewayAccountAndService(1, 'some-gateway-external-id', 'stripe', 'some-service-external-id')

      await getGatewayAccountAndService(req, res, next)
      expect(req.account.disableToggle3ds).to.equal(true)
      expect(req.account.external_id).to.equal('some-gateway-external-id')
    })
  })
  describe('extend gateway account data with supports3ds field', () => {
    ['worldpay', 'smartpay', 'epdq', 'stripe'].forEach(function (value) {
      it('should extend the account data with supports3ds set to true if account type is ' + value, async () => {
        const getGatewayAccountAndService = setupGetGatewayAccountAndService(1, 'some-gateway-external-id', value, 'some-service-external-id')

        await getGatewayAccountAndService(req, res, next)
        expect(req.account.supports3ds).to.equal(true)
        expect(req.account.external_id).to.equal('some-gateway-external-id')
      })
    })
    it('should extend the account data with supports3ds set to false if account type is sandbox', async () => {
      const getGatewayAccountAndService = setupGetGatewayAccountAndService(1, 'some-gateway-external-id', 'sandbox', 'some-service-external-id')

      await getGatewayAccountAndService(req, res, next)
      expect(req.account.supports3ds).to.equal(false)
      expect(req.account.external_id).to.equal('some-gateway-external-id')
    })
  })
  describe('extend gateway account data stripe setup', () => {
    ['worldpay', 'smartpay', 'epdq', 'sandbox'].forEach(function (value) {
      it('should not extend the account data with stripe setup if account type is ' + value, async () => {
        const getGatewayAccountAndService = setupGetGatewayAccountAndService(1, 'some-gateway-external-id', value, 'some-service-external-id')

        await getGatewayAccountAndService(req, res, next)
        expect(req.account.external_id).to.equal('some-gateway-external-id')
        expect(req.account).to.not.have.property('connectorGatewayAccountStripeProgress')
      })
    })
    it('should extend the account data with supports3ds set to false if account type is stripe', async () => {
      const getGatewayAccountAndService = setupGetGatewayAccountAndService(1, 'some-gateway-external-id', 'stripe', 'some-service-external-id')

      await getGatewayAccountAndService(req, res, next)
      expect(req.account.external_id).to.equal('some-gateway-external-id')
      expect(req.account).to.have.property('connectorGatewayAccountStripeProgress')
    })
  })
})
