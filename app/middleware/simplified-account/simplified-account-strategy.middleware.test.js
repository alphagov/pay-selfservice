const { expect } = require('chai')
const path = require('path')
const proxyquire = require('proxyquire')
const sinon = require('sinon')
const User = require('../../models/User.class')
const userFixtures = require('../../../test/fixtures/user.fixtures')
const stripeAccountSetupFixture = require('../../../test/fixtures/stripe-account-setup.fixtures')

const A_GATEWAY_EXTERNAL_ID = 'a-gateway-external-id'
const A_SERVICE_EXTERNAL_ID = 'a-service-external-id'

let req, res, next

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

const setupSimplifiedAccountStrategyTest = function (options) {
  const {
    gatewayAccountID,
    gatewayAccountExternalId,
    paymentProvider,
    serviceExternalId,
    accountType,
    errorCode
  } = options

  req = {
    params: { serviceExternalId, accountType },
    user: buildUser(serviceExternalId, [`${gatewayAccountID}`])
  }
  next = sinon.spy()

  let connectorGetAccountMock
  if (errorCode) {
    connectorGetAccountMock = sinon.stub().rejects({ errorCode })
  } else {
    connectorGetAccountMock = sinon.stub().resolves({
      gateway_account_id: gatewayAccountID,
      external_id: gatewayAccountExternalId,
      payment_provider: paymentProvider
    })
  }

  const connectorMock = {
    ConnectorClient: function () {
      return {
        getAccountByServiceIdAndAccountType: connectorGetAccountMock,
        getStripeAccountSetup: paymentProvider === 'stripe'
          ? sinon.stub().resolves(stripeAccountSetupFixture.buildGetStripeAccountSetupResponse())
          : undefined
      }
    }
  }

  const simplifiedAccountStrategy = proxyquire(
    path.join(__dirname, './simplified-account-strategy.middleware'),
    { '../../services/clients/connector.client.js': connectorMock }
  )

  return {
    simplifiedAccountStrategy,
    connectorGetAccountMock
  }
}

describe('Middleware: getSimplifiedAccount', () => {
  it('should set gateway account and service on request object', async () => {
    const { simplifiedAccountStrategy, connectorGetAccountMock } = setupSimplifiedAccountStrategyTest({
      gatewayAccountID: '1',
      gatewayAccountExternalId: A_GATEWAY_EXTERNAL_ID,
      paymentProvider: 'worldpay',
      serviceExternalId: A_SERVICE_EXTERNAL_ID,
      accountType: 'test'
    })
    await simplifiedAccountStrategy(req, res, next)

    sinon.assert.calledOnce(next)
    expect(connectorGetAccountMock.called).to.equal(true)
    expect(connectorGetAccountMock.calledWith({
      serviceId: A_SERVICE_EXTERNAL_ID,
      accountType: 'test'
    })).to.equal(true)

    expect(req.account.external_id).to.equal(A_GATEWAY_EXTERNAL_ID)
    expect(req.service.externalId).to.equal(A_SERVICE_EXTERNAL_ID)
  })
  it('should error if service external ID or gateway account type cannot be resolved from request parameters', async () => {
    const { simplifiedAccountStrategy } = setupSimplifiedAccountStrategyTest({
      gatewayAccountID: '1',
      gatewayAccountExternalId: A_GATEWAY_EXTERNAL_ID,
      paymentProvider: 'worldpay',
      serviceExternalId: A_SERVICE_EXTERNAL_ID,
      accountType: 'test'
    })
    req.params.serviceExternalId = undefined
    req.params.accountType = undefined

    await simplifiedAccountStrategy(req, res, next)

    const expectedError = sinon.match.instanceOf(Error)
      .and(sinon.match.has('message', 'Could not resolve service external ID or gateway account type from request params'))
    sinon.assert.calledWith(next, expectedError)
  })
  it('should error if gateway account lookup fails for account type', async () => {
    const { simplifiedAccountStrategy } = setupSimplifiedAccountStrategyTest({
      gatewayAccountID: '1',
      serviceExternalId: A_SERVICE_EXTERNAL_ID,
      accountType: 'test',
      errorCode: '404'
    })
    await simplifiedAccountStrategy(req, res, next)

    const expectedError = sinon.match.instanceOf(Error)
      .and(sinon.match.has('message', 'Could not retrieve gateway account with provided parameters'))
    sinon.assert.calledWith(next, expectedError)
  })
  describe('extend gateway account data with disableToggle3ds field', () => {
    it('should extend the account data with disableToggle3ds set to false if payment provider is worldpay', async () => {
      const { simplifiedAccountStrategy } = setupSimplifiedAccountStrategyTest({
        gatewayAccountID: '1',
        gatewayAccountExternalId: A_GATEWAY_EXTERNAL_ID,
        paymentProvider: 'worldpay',
        serviceExternalId: A_SERVICE_EXTERNAL_ID,
        accountType: 'test'
      })
      await simplifiedAccountStrategy(req, res, next)
      expect(req.account.disableToggle3ds).to.equal(false)
      expect(req.account.external_id).to.equal(A_GATEWAY_EXTERNAL_ID)
    })
    it('should extend the account data with disableToggle3ds set to true if payment provider is stripe', async () => {
      const { simplifiedAccountStrategy } = setupSimplifiedAccountStrategyTest({
        gatewayAccountID: '1',
        gatewayAccountExternalId: A_GATEWAY_EXTERNAL_ID,
        paymentProvider: 'stripe',
        serviceExternalId: A_SERVICE_EXTERNAL_ID,
        accountType: 'test'
      })
      await simplifiedAccountStrategy(req, res, next)
      expect(req.account.disableToggle3ds).to.equal(true)
      expect(req.account.external_id).to.equal(A_GATEWAY_EXTERNAL_ID)
    })
  })
  describe('extend gateway account data with supports3ds field', () => {
    ['worldpay', 'stripe'].forEach(function (paymentProvider) {
      it('should extend the account data with supports3ds set to true if payment provider is ' + paymentProvider, async () => {
        const { simplifiedAccountStrategy } = setupSimplifiedAccountStrategyTest({
          gatewayAccountID: '1',
          gatewayAccountExternalId: A_GATEWAY_EXTERNAL_ID,
          paymentProvider,
          serviceExternalId: A_SERVICE_EXTERNAL_ID,
          accountType: 'test'
        })
        await simplifiedAccountStrategy(req, res, next)
        expect(req.account.supports3ds).to.equal(true)
        expect(req.account.external_id).to.equal(A_GATEWAY_EXTERNAL_ID)
      })
    })
    it('should extend the account data with supports3ds set to false if payment provider is sandbox', async () => {
      const { simplifiedAccountStrategy } = setupSimplifiedAccountStrategyTest({
        gatewayAccountID: '1',
        gatewayAccountExternalId: A_GATEWAY_EXTERNAL_ID,
        paymentProvider: 'sandbox',
        serviceExternalId: A_SERVICE_EXTERNAL_ID,
        accountType: 'test'
      })
      await simplifiedAccountStrategy(req, res, next)
      expect(req.account.supports3ds).to.equal(false)
      expect(req.account.external_id).to.equal(A_GATEWAY_EXTERNAL_ID)
    })
  })
  describe('extend gateway account data stripe setup', () => {
    ['worldpay', 'sandbox'].forEach(function (paymentProvider) {
      it('should not extend the account data with stripe setup if payment provider is ' + paymentProvider, async () => {
        const { simplifiedAccountStrategy } = setupSimplifiedAccountStrategyTest({
          gatewayAccountID: '1',
          gatewayAccountExternalId: A_GATEWAY_EXTERNAL_ID,
          paymentProvider,
          serviceExternalId: A_SERVICE_EXTERNAL_ID,
          accountType: 'test'
        })
        await simplifiedAccountStrategy(req, res, next)
        expect(req.account.external_id).to.equal(A_GATEWAY_EXTERNAL_ID)
        expect(req.account).to.not.have.property('connectorGatewayAccountStripeProgress')
      })
    })
    it('should extend the account data with supports3ds set to false if payment provider is stripe', async () => {
      const { simplifiedAccountStrategy } = setupSimplifiedAccountStrategyTest({
        gatewayAccountID: '1',
        gatewayAccountExternalId: A_GATEWAY_EXTERNAL_ID,
        paymentProvider: 'stripe',
        serviceExternalId: A_SERVICE_EXTERNAL_ID,
        accountType: 'test'
      })
      await simplifiedAccountStrategy(req, res, next)
      expect(req.account.external_id).to.equal(A_GATEWAY_EXTERNAL_ID)
      expect(req.account).to.have.property('connectorGatewayAccountStripeProgress')
    })
  })
})
