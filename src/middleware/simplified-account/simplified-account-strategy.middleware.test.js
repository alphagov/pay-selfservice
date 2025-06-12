const { expect } = require('chai')
const { NotFoundError } = require('../../errors')
const path = require('path')
const proxyquire = require('proxyquire')
const sinon = require('sinon')
const User = require('../../models/User.class')
const userFixtures = require('../../../test/fixtures/user.fixtures')
const GatewayAccount = require('@models/GatewayAccount.class')

const A_GATEWAY_EXTERNAL_ID = 'a-gateway-external-id'
const A_SERVICE_EXTERNAL_ID = 'a-service-external-id'

let req, res, next

const buildUser = (serviceExternalId, gatewayAccountIds) => {
  return new User(
    userFixtures.validUserResponse({
      service_roles: [
        {
          service: {
            external_id: serviceExternalId,
            gateway_account_ids: gatewayAccountIds,
          },
        },
      ],
    })
  )
}

const setupSimplifiedAccountStrategyTest = function (options) {
  const {
    gatewayAccountId,
    gatewayAccountExternalId,
    paymentProvider,
    serviceExternalId,
    serviceGatewayAccountIds,
    accountType,
    errorCode,
  } = options

  req = {
    params: { serviceExternalId, accountType },
    user: buildUser(serviceExternalId, serviceGatewayAccountIds || [`${gatewayAccountId}`]),
  }
  next = sinon.spy()

  let getGatewayAccountMock
  if (errorCode) {
    getGatewayAccountMock = sinon.stub().rejects({ errorCode })
  } else {
    getGatewayAccountMock = sinon.stub().resolves(
      new GatewayAccount({
        gateway_account_id: gatewayAccountId,
        external_id: gatewayAccountExternalId,
        payment_provider: paymentProvider,
      })
    )
  }

  const loggerMock = {
    info: sinon.stub(),
    error: sinon.stub(),
    debug: sinon.stub(),
    warn: sinon.stub(),
  }

  const loggerStub = sinon.stub().callsFake((_) => {
    return loggerMock
  })

  const mockGatewayAccountsService = {
    getGatewayAccountByServiceExternalIdAndType: getGatewayAccountMock
  }

  const simplifiedAccountStrategy = proxyquire(path.join(__dirname, './simplified-account-strategy.middleware'), {
    '@services/gateway-accounts.service': mockGatewayAccountsService,
    '@utils/logger': loggerStub,
  })

  return {
    simplifiedAccountStrategy,
    getGatewayAccountMock,
    loggerMock,
  }
}

describe('Middleware: getSimplifiedAccount', () => {
  it('should set gateway account and service on request object', async () => {
    const { simplifiedAccountStrategy, getGatewayAccountMock } = setupSimplifiedAccountStrategyTest({
      gatewayAccountId: '1',
      gatewayAccountExternalId: A_GATEWAY_EXTERNAL_ID,
      paymentProvider: 'worldpay',
      serviceExternalId: A_SERVICE_EXTERNAL_ID,
      accountType: 'test',
    })
    await simplifiedAccountStrategy(req, res, next)

    sinon.assert.calledOnce(next)
    sinon.assert.calledOnceWithExactly(getGatewayAccountMock, A_SERVICE_EXTERNAL_ID, 'test')
    expect(req.account.externalId).to.equal(A_GATEWAY_EXTERNAL_ID)
    expect(req.service.externalId).to.equal(A_SERVICE_EXTERNAL_ID)
  })
  it('should error if service external ID or gateway account type cannot be resolved from request parameters', async () => {
    const { simplifiedAccountStrategy } = setupSimplifiedAccountStrategyTest({
      gatewayAccountId: '1',
      gatewayAccountExternalId: A_GATEWAY_EXTERNAL_ID,
      paymentProvider: 'worldpay',
      serviceExternalId: A_SERVICE_EXTERNAL_ID,
      accountType: 'test',
    })
    req.params.serviceExternalId = undefined
    req.params.accountType = undefined

    await simplifiedAccountStrategy(req, res, next)

    const expectedError = sinon.match
      .instanceOf(NotFoundError)
      .and(
        sinon.match.has('message', 'Could not resolve service external ID or gateway account type from request params')
      )
    sinon.assert.calledOnce(next)
    sinon.assert.calledWith(next, expectedError)
  })
  it('should error if gateway account lookup fails for account type', async () => {
    const { simplifiedAccountStrategy } = setupSimplifiedAccountStrategyTest({
      gatewayAccountId: '1',
      serviceExternalId: A_SERVICE_EXTERNAL_ID,
      accountType: 'test',
      errorCode: '404',
    })
    await simplifiedAccountStrategy(req, res, next)

    const expectedError = sinon.match
      .instanceOf(NotFoundError)
      .and(sinon.match.has('message', 'Could not retrieve gateway account with provided parameters'))
    sinon.assert.calledOnce(next)
    sinon.assert.calledWith(next, expectedError)
  })
  it('should warn if gateway account id is not present on service', async () => {
    const { simplifiedAccountStrategy, loggerMock } = setupSimplifiedAccountStrategyTest({
      gatewayAccountId: '1',
      gatewayAccountExternalId: A_GATEWAY_EXTERNAL_ID,
      serviceGatewayAccountIds: ['2', '3'],
      serviceExternalId: A_SERVICE_EXTERNAL_ID,
      accountType: 'test',
    })
    await simplifiedAccountStrategy(req, res, next)
    sinon.assert.calledOnceWithExactly(
      loggerMock.warn,
      `Resolved gateway account is not present on service [service_external_id: ${A_SERVICE_EXTERNAL_ID}, gateway_account_id: 1]`
    )
    expect(req.account.externalId).to.equal(A_GATEWAY_EXTERNAL_ID)
    expect(req.service.externalId).to.equal(A_SERVICE_EXTERNAL_ID)
  })
})
