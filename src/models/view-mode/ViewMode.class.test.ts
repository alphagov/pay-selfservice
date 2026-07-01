import proxyquire from 'proxyquire'
import sinon from 'sinon'
import { UserFixture } from '@test/fixtures/user/user.fixture'
import type { ViewMode as ViewModeClass } from '@models/view-mode/ViewMode.class'
import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import PaymentProviders from '@models/constants/payment-providers'

const mockGatewayAccountsService = {
  findGatewayAccountsByService: sinon.stub(),
}

const { ViewMode } = proxyquire('@models/view-mode/ViewMode.class', {
  '@services/gateway-accounts.service': mockGatewayAccountsService,
}) as { ViewMode: typeof ViewModeClass }

const user = new UserFixture()

const sandboxGatewayAccount = new GatewayAccountFixture()
const stripeGatewayAccount = GatewayAccountFixture.forStripe({ id: 2, serviceId: 'service-2' })
const worldpayGatewayAccount = GatewayAccountFixture.forWorldpay({ id: 3, serviceId: 'service-3' })

describe('View Mode class', () => {
  describe('determining view mode for user', () => {
    it('should populate the list of payment providers', async () => {
      mockGatewayAccountsService.findGatewayAccountsByService.resolves([
        sandboxGatewayAccount.toGatewayAccount(),
        stripeGatewayAccount.toGatewayAccount(),
        worldpayGatewayAccount.toGatewayAccount(),
      ])

      const viewMode = await ViewMode.forUser(user.toUser(), 'test')

      viewMode.paymentProviders.should.be
        .an('array')
        .and.to.have.members([PaymentProviders.SANDBOX, PaymentProviders.STRIPE, PaymentProviders.WORLDPAY])
        .and.to.have.length(3)
    })
  })
})
