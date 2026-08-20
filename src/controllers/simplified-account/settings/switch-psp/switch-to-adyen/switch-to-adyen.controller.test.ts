import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import { PaymentProvider } from '@models/constants/payment-provider'
import { UserFixture } from '@test/fixtures/user/user.fixture'
import { ServiceFixture } from '@test/fixtures/service/service.fixture'
import sinon from 'sinon'
import { AdyenTasks } from '@models/task-workflows/AdyenTasks.class'
import { AdyenTaskIdentifier } from '@models/task-workflows/task-identifiers/adyen-task-identifiers'
import TaskStatus from '@models/constants/task-status'

const SERVICE_EXTERNAL_ID = 'service123abc'
const serviceFixture = new ServiceFixture({
  externalId: SERVICE_EXTERNAL_ID,
})

const mockResponse = sinon.stub()

const { req, res, call } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/switch-psp/switch-to-adyen/switch-to-adyen.controller'
)
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount(
    GatewayAccountFixture.forSwitchingPsp(PaymentProvider.STRIPE, PaymentProvider.ADYEN, [], [], {
      type: 'live',
    }).toGatewayAccount()
  )
  .withUser(UserFixture.asServiceAdmin([serviceFixture]).toUser())
  .withStubs({
    '@utils/response': { response: mockResponse },
  })
  .build()

describe('Switch to Adyen controller tests', () => {
  it('should call the response function with req, res, and the template path', async () => {
    await call('get')

    mockResponse.should.have.been.calledOnce
    mockResponse.should.have.been.calledWith(
      req,
      res,
      'simplified-account/settings/switch-psp/switch-to-adyen/index.njk'
    )
  })

  it('should call the response method with the task list', async () => {
    await call('get')

    mockResponse.should.have.been.calledOnce
    const context = mockResponse.firstCall.lastArg as {
      currentPsp: PaymentProvider
      adyenTasks: AdyenTasks
    }

    context.currentPsp.should.eq(PaymentProvider.STRIPE)
    context.adyenTasks.tasks.should.have.length(6)
    context.adyenTasks.confirmOrganisationTasks.should.have.length(1)
    context.adyenTasks.acceptLegalTermsTasks.should.have.length(1)
    context.adyenTasks.completeOrganisationDetailsTasks.should.have.length(4)

    context.adyenTasks.confirmOrganisationTasks[0].id.should.eq(AdyenTaskIdentifier.ORG_DETAILS)
    context.adyenTasks.confirmOrganisationTasks[0].status.should.eq(TaskStatus.NOT_STARTED)

    context.adyenTasks.acceptLegalTermsTasks[0].id.should.eq(AdyenTaskIdentifier.LEGAL_TERMS)
    context.adyenTasks.acceptLegalTermsTasks[0].status.should.eq(TaskStatus.NOT_STARTED)

    context.adyenTasks.completeOrganisationDetailsTasks[0].id.should.eq(AdyenTaskIdentifier.BANK_DETAILS)
    context.adyenTasks.completeOrganisationDetailsTasks[0].status.should.eq(TaskStatus.NOT_STARTED)

    context.adyenTasks.completeOrganisationDetailsTasks[1].id.should.eq(AdyenTaskIdentifier.RESPONSIBLE_PERSON)
    context.adyenTasks.completeOrganisationDetailsTasks[1].status.should.eq(TaskStatus.NOT_STARTED)

    context.adyenTasks.completeOrganisationDetailsTasks[2].id.should.eq(AdyenTaskIdentifier.SERVICE_DIRECTOR)
    context.adyenTasks.completeOrganisationDetailsTasks[2].status.should.eq(TaskStatus.NOT_STARTED)

    context.adyenTasks.completeOrganisationDetailsTasks[3].id.should.eq(AdyenTaskIdentifier.REASON_FOR_TAKING_PAYMENTS)
    context.adyenTasks.completeOrganisationDetailsTasks[3].status.should.eq(TaskStatus.NOT_STARTED)
  })
})
