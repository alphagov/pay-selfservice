import { expect } from 'chai'
import sinon from 'sinon'
import { NotFoundError } from '@root/errors'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { NextFunction } from 'express'
import restrictToSwitchingAccount from './restrict-to-switching-account'
import gatewayAccountFixtures from '@test/fixtures/gateway-account.fixtures'
import GatewayAccount from '@models/gateway-account/GatewayAccount.class'
import PaymentProviders from '@models/constants/payment-providers'

describe('restrictToSwitchingAccount middleware', () => {
  let req: Partial<ServiceRequest>
  let res: Partial<ServiceResponse>
  let next: sinon.SinonSpy

  beforeEach(() => {
    req = {
      account: new GatewayAccount(
        gatewayAccountFixtures.validGatewayAccount({
          provider_switch_enabled: true,
          gateway_account_credentials: [
            { state: 'ENTERED', id: 200, payment_provider: PaymentProviders.WORLDPAY },
            { state: 'ACTIVE', id: 300, payment_provider: PaymentProviders.STRIPE },
          ],
        })
      ),
    } as Partial<ServiceRequest>

    res = {} as Partial<ServiceResponse>
    next = sinon.spy()
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('when account is switching to stripe', () => {
    it('should call next() without error when switching credential provider is stripe', () => {
      const middleware = restrictToSwitchingAccount(PaymentProviders.STRIPE)
      middleware(req as ServiceRequest, res as ServiceResponse, next as NextFunction)
      sinon.assert.calledOnce(next)
    })

    it('should call next() with error when switching credential provider is worldpay', () => {
      const middleware = restrictToSwitchingAccount(PaymentProviders.STRIPE)
      middleware(req as ServiceRequest, res as ServiceResponse, next as NextFunction)
      sinon.assert.calledOnce(next)
      const errorArg = next.getCall(0).args[0] as NotFoundError
      expect(errorArg).to.be.instanceOf(NotFoundError)
      expect(errorArg.message).to.equal(
        'This page is only available for accounts flagged as switching provider to stripe'
      )
    })
  })

  describe('when account is not switching', () => {
    it('should call next() with error', () => {
      const middleware = restrictToSwitchingAccount(PaymentProviders.WORLDPAY)
      middleware(
        {
          account: new GatewayAccount(
            gatewayAccountFixtures.validGatewayAccount({
              provider_switch_enabled: false
            })
          ),
        } as ServiceRequest,
        res as ServiceResponse,
        next as NextFunction
      )
      sinon.assert.calledOnce(next)
      const errorArg = next.getCall(0).args[0] as NotFoundError
      expect(errorArg).to.be.instanceOf(NotFoundError)
      expect(errorArg.message).to.equal(
        'This page is only available for accounts flagged as switching provider to worldpay'
      )
    })
  })
})
