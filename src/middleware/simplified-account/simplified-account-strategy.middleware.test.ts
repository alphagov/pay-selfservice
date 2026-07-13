import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import { expect } from 'chai'
import { NotFoundError } from '../../errors'
import sinon from 'sinon'
import { UserFixture } from '@test/fixtures/user/user.fixture'
import { ServiceFixture } from '@test/fixtures/service/service.fixture'
import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import { ServiceRequest } from '@utils/types/express'

const A_GATEWAY_EXTERNAL_ID = 'a-gateway-external-id'
const A_SERVICE_EXTERNAL_ID = 'a-service-external-id'

const gatewayAccount = new GatewayAccountFixture({
  externalId: A_GATEWAY_EXTERNAL_ID,
  id: 1,
})
const service = new ServiceFixture({
  externalId: A_SERVICE_EXTERNAL_ID,
  gatewayAccountIds: [gatewayAccount.id.toString()],
})
const user = UserFixture.asServiceAdmin([service])

const loggerMock = {
  info: sinon.stub(),
  error: sinon.stub(),
  debug: sinon.stub(),
  warn: sinon.stub(),
}

const loggerStub = sinon.stub().callsFake((_) => {
  return loggerMock
})

const addLoggingFieldStub = sinon.stub()

const mockGatewayAccountsService = {
  getGatewayAccountByServiceExternalIdAndType: sinon.stub(),
}

const { call, next, nextRequest } = new ControllerTestBuilder(
  '@middleware/simplified-account/simplified-account-strategy.middleware'
)
  .withUser(user.toUser())
  .withStubs({
    '@services/gateway-accounts.service': mockGatewayAccountsService,
    '@utils/logger': loggerStub,
    '@services/clients/base/request-context': {
      addField: addLoggingFieldStub,
    },
  })
  .build()

describe('Middleware: getSimplifiedAccount', () => {
  it('should set gateway account and service on request object', async () => {
    mockGatewayAccountsService.getGatewayAccountByServiceExternalIdAndType.resolves(gatewayAccount.toGatewayAccount())
    nextRequest({
      params: {
        serviceExternalId: A_SERVICE_EXTERNAL_ID,
        accountType: 'test',
      },
    })
    const { req } = (await call()) as { req: ServiceRequest }

    sinon.assert.calledOnce(next)
    sinon.assert.calledOnceWithExactly(
      mockGatewayAccountsService.getGatewayAccountByServiceExternalIdAndType,
      A_SERVICE_EXTERNAL_ID,
      'test'
    )
    expect(req.account.externalId).to.equal(A_GATEWAY_EXTERNAL_ID)
    expect(req.service.externalId).to.equal(A_SERVICE_EXTERNAL_ID)
  })

  it('should error if service external ID or gateway account type cannot be resolved from request parameters', async () => {
    nextRequest({
      params: {
        serviceExternalId: undefined,
        accountType: undefined,
      },
    })
    await call()

    const expectedError = sinon.match
      .instanceOf(NotFoundError)
      .and(
        sinon.match.has('message', 'Could not resolve service external ID or gateway account type from request params')
      )
    sinon.assert.calledOnce(next)
    sinon.assert.calledWith(next, expectedError)
  })

  it('should error if gateway account type cannot be resolved from request parameters', async () => {
    nextRequest({
      params: {
        serviceExternalId: A_SERVICE_EXTERNAL_ID,
        accountType: 'unknown-account-type',
      },
    })
    await call()

    const expectedError = sinon.match
      .instanceOf(NotFoundError)
      .and(
        sinon.match.has('message', 'Could not resolve service external ID or gateway account type from request params')
      )
    sinon.assert.calledOnce(next)
    sinon.assert.calledWith(next, expectedError)
  })

  it('should error if gateway account lookup fails for account type', async () => {
    mockGatewayAccountsService.getGatewayAccountByServiceExternalIdAndType.rejects({ statusCode: 404 })
    nextRequest({
      params: {
        serviceExternalId: A_SERVICE_EXTERNAL_ID,
        accountType: 'test',
      },
    })
    await call()

    const expectedError = sinon.match
      .instanceOf(NotFoundError)
      .and(sinon.match.has('message', 'Could not retrieve gateway account with provided parameters'))
    sinon.assert.calledOnce(next)
    sinon.assert.calledWith(next, expectedError)
  })

  it('should warn if gateway account id is not present on service', async () => {
    const serviceMissingGatewayAccountId = new ServiceFixture(service, { gatewayAccountIds: ['2', '3'] })
    const userWithService = UserFixture.asServiceAdmin([serviceMissingGatewayAccountId])

    mockGatewayAccountsService.getGatewayAccountByServiceExternalIdAndType.resolves(gatewayAccount.toGatewayAccount())
    nextRequest({
      params: {
        serviceExternalId: A_SERVICE_EXTERNAL_ID,
        accountType: 'test',
      },
      user: userWithService.toUser(),
    })
    const { req } = (await call()) as { req: ServiceRequest }

    sinon.assert.calledOnceWithExactly(
      loggerMock.warn,
      `Resolved gateway account is not present on service [service_external_id: ${A_SERVICE_EXTERNAL_ID}, gateway_account_id: 1]`
    )
    expect(req.account.externalId).to.equal(A_GATEWAY_EXTERNAL_ID)
    expect(req.service.externalId).to.equal(A_SERVICE_EXTERNAL_ID)
  })

  describe('logger configuration', () => {
    it('should set the correct logging fields with snake_case key names', async () => {
      mockGatewayAccountsService.getGatewayAccountByServiceExternalIdAndType.resolves(gatewayAccount.toGatewayAccount())
      nextRequest({
        params: {
          serviceExternalId: A_SERVICE_EXTERNAL_ID,
          accountType: 'test',
        },
      })
      await call()

      addLoggingFieldStub.should.have.been.calledThrice
      addLoggingFieldStub.should.have.been.calledWith('gateway_account_type', 'test')
      addLoggingFieldStub.should.have.been.calledWith('gateway_account_external_id', 'a-gateway-external-id')
      addLoggingFieldStub.should.have.been.calledWith('service_external_id', 'a-service-external-id')
    })
  })
})
