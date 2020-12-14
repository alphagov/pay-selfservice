'use strict'

const { NotFoundError } = require('../../../app/errors')
const path = require('path')
const proxyquire = require('proxyquire')
const sinon = require('sinon')
const { expect } = require('chai')
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
  return userFixtures.validUserResponse({
    service_roles: [{
      service: {
        external_id: serviceExternalId,
        gateway_account_ids: gatewayAccountIds
      }
    }]
  }).getAsObject()
}

const setupGetGatewayAccountAndService = function (gatewayAccountID, gatewayAccountExternalId, paymentProvider, serviceExternalId) {
  req = {
    params: { gatewayAccountExternalId: gatewayAccountExternalId, serviceExternalId: serviceExternalId },
    correlationId: 'some-correlation-id'
  }
  req.user = buildUser(serviceExternalId, [ `${gatewayAccountID}` ])
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
  it('should set gateway account and service on request object ', () => {
    const getGatewayAccountAndService = setupGetGatewayAccountAndService(1, 'some-gateway-external-id', 'worldpay', 'some-service-external-id')
    next = function () {
      expect(connectorGetAccountMock.called).to.equal(true)
      expect(connectorGetAccountMock.calledWith({
        gatewayAccountExternalId: 'some-gateway-external-id',
        correlationId: 'some-correlation-id'
      })).to.equal(true)

      expect(req.account.external_id).to.equal('some-gateway-external-id')
      expect(req.service.externalId).to.equal('some-service-external-id')
      expect(req.service.hasCardGatewayAccount).to.equal(true)

      expect(req.gateway_account.currentGatewayAccountId).to.equal(1)
    }
    return getGatewayAccountAndService(req, res, next)
  })
  it('should not set gateway account, if gateway account external ID is not resolved', () => {
    const getGatewayAccountAndService = setupGetGatewayAccountAndService(1, 'some-gateway-external-id', 'worldpay', 'some-service-external-id')
    req.params['gatewayAccountExternalId'] = undefined

    next = function () {
      expect(req).to.not.have.property('account')
      expect(req).to.not.have.property('gateway_account')

      expect(req.service.externalId).to.equal('some-service-external-id')
    }
    return getGatewayAccountAndService(req, res, next)
  })
  it('should error, if both gateway account external ID and service external ID cannot be resolved', () => {
    const getGatewayAccountAndService = setupGetGatewayAccountAndService(1, 'some-gateway-external-id', 'worldpay', 'some-service-external-id')
    req.params['gatewayAccountExternalId'] = undefined
    req.params['serviceExternalId'] = undefined

    next = function (err) {
      expect(err.message).to.equal('Could not resolve gateway account external ID or service external ID from request params')
      expect(err).to.be.instanceOf(Error)
    }
    return getGatewayAccountAndService(req, res, next)
  })
  it('should error, if gateway account not found for gatewayExternalId', () => {
    const getGatewayAccountAndService = setupGetGatewayAccountClientError('some-gateway-account-external-id', 404)

    next = function (err) {
      expect(err.message).to.equal('Gateway account not found')
      expect(err).to.be.instanceOf(NotFoundError)
    }
    return getGatewayAccountAndService(req, res, next)
  })
  it('should error, if connector returns error (other than 404)', () => {
    const getGatewayAccountAndService = setupGetGatewayAccountClientError('some-gateway-account-external-id', 500)

    next = function (err) {
      expect(err.message).to.equal('Error retrieving Gateway account')
      expect(err).to.be.instanceOf(Error)
    }
    return getGatewayAccountAndService(req, res, next)
  })
  it('should set service based on gateway account, when serviceExternalId cannot be resolved', () => {
    const getGatewayAccountAndService = setupGetGatewayAccountAndService(1, 'some-gateway-external-id', 'worldpay', 'some-service-external-id')
    req.params['serviceExternalId'] = undefined
    next = function () {
      expect(req.service.externalId).to.equal('some-service-external-id')
    }
    return getGatewayAccountAndService(req, res, next)
  })
  it('should error, when service cannot be resolved for serviceExternalId and gateway account (if available)', () => {
    const getGatewayAccountAndService = setupGetGatewayAccountAndService(1, 'some-gateway-external-id', 'worldpay', 'some-service-external-id')
    req.params['serviceExternalId'] = 'non-existent-service'

    next = function (err) {
      expect(err.message).to.equal('Service not found for user')
      expect(err).to.be.instanceOf(NotFoundError)
    }
    return getGatewayAccountAndService(req, res, next)
  })
  it('should error, when the gateway account from connector does not belong to service for serviceExternalId', () => {
    const getGatewayAccountAndService = setupGetGatewayAccountAndService(1, 'some-gateway-external-id', 'worldpay', 'some-service-external-id')
    req.user.serviceRoles[0].service.gatewayAccountIds = ['some-other-gateway-account']

    next = function (err) {
      expect(err.message).to.equal('Service not found for user')
      expect(err).to.be.instanceOf(NotFoundError)
    }
    return getGatewayAccountAndService(req, res, next)
  })
  it('should error, when serviceExternalId is not available and service cannot be resolved for gateway account', () => {
    const getGatewayAccountAndService = setupGetGatewayAccountAndService(1, 'some-gateway-external-id', 'worldpay', 'some-service-external-id')
    req.params['serviceExternalId'] = undefined
    req.user.serviceRoles[0].service.gatewayAccountIds = ['some-other-gateway-accounts']
    next = function (err) {
      expect(err.message).to.equal('Service not found for user')
      expect(err).to.be.instanceOf(NotFoundError)
    }
    return getGatewayAccountAndService(req, res, next)
  })
  describe('extend gateway account data with disableToggle3ds field', () => {
    ['worldpay', 'smartpay', 'epdq'].forEach(function (value) {
      it('should extend the account data with disableToggle3ds set to false if account type is ' + value, () => {
        const getGatewayAccountAndService = setupGetGatewayAccountAndService(1, 'some-gateway-external-id', value, 'some-service-external-id')
        next = function () {
          expect(req.account.disableToggle3ds).to.equal(false)
          expect(req.account.external_id).to.equal('some-gateway-external-id')
        }
        return getGatewayAccountAndService(req, res, next)
      })
    })
    it('should extend the account data with disableToggle3ds set to true if account type is stripe', () => {
      const getGatewayAccountAndService = setupGetGatewayAccountAndService(1, 'some-gateway-external-id', 'stripe', 'some-service-external-id')
      next = function () {
        expect(req.account.disableToggle3ds).to.equal(true)
        expect(req.account.external_id).to.equal('some-gateway-external-id')
      }
      return getGatewayAccountAndService(req, res, next)
    })
  })
  describe('extend gateway account data with supports3ds field', () => {
    ['worldpay', 'smartpay', 'epdq', 'stripe'].forEach(function (value) {
      it('should extend the account data with supports3ds set to true if account type is ' + value, () => {
        const getGatewayAccountAndService = setupGetGatewayAccountAndService(1, 'some-gateway-external-id', value, 'some-service-external-id')
        next = function () {
          expect(req.account.supports3ds).to.equal(true)
          expect(req.account.external_id).to.equal('some-gateway-external-id')
        }
        return getGatewayAccountAndService(req, res, next)
      })
    })
    it('should extend the account data with supports3ds set to false if account type is sandbox', () => {
      const getGatewayAccountAndService = setupGetGatewayAccountAndService(1, 'some-gateway-external-id', 'sandbox', 'some-service-external-id')
      next = function () {
        expect(req.account.supports3ds).to.equal(false)
        expect(req.account.external_id).to.equal('some-gateway-external-id')
      }
      return getGatewayAccountAndService(req, res, next)
    })
  })
  describe('extend gateway account data stripe setup', () => {
    ['worldpay', 'smartpay', 'epdq', 'sandbox'].forEach(function (value) {
      it('should not extend the account data with stripe setup if account type is ' + value, () => {
        const getGatewayAccountAndService = setupGetGatewayAccountAndService(1, 'some-gateway-external-id', value, 'some-service-external-id')
        next = function () {
          expect(req.account.external_id).to.equal('some-gateway-external-id')
          expect(req.account).to.not.have.property('connectorGatewayAccountStripeProgress')
        }
        return getGatewayAccountAndService(req, res, next)
      })
    })
    it('should extend the account data with supports3ds set to false if account type is stripe', () => {
      const getGatewayAccountAndService = setupGetGatewayAccountAndService(1, 'some-gateway-external-id', 'stripe', 'some-service-external-id')
      next = function () {
        expect(req.account.external_id).to.equal('some-gateway-external-id')
        expect(req.account).to.have.property('connectorGatewayAccountStripeProgress')
      }
      return getGatewayAccountAndService(req, res, next)
    })
  })
})
