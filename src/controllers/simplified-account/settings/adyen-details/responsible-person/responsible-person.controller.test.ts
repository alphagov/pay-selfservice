import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import { PaymentProvider } from '@models/constants/payment-provider'
import { UserFixture } from '@test/fixtures/user/user.fixture'
import { ServiceFixture } from '@test/fixtures/service/service.fixture'
import sinon from 'sinon'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { ResponsiblePersonSession } from './constants'

const SERVICE_EXTERNAL_ID = 'service123abc'
const SERVICE_TYPE = 'live'
const serviceFixture = new ServiceFixture({
  externalId: SERVICE_EXTERNAL_ID,
})
const GATEWAY_ACCOUNT = GatewayAccountFixture.forSwitchingPsp(PaymentProvider.STRIPE, PaymentProvider.ADYEN, [], [], {
  type: 'live',
}).toGatewayAccount()

const mockResponse = sinon.stub()

const { nextRequest, res, call } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/adyen-details/responsible-person/responsible-person.controller'
)
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount(GATEWAY_ACCOUNT)
  .withUser(UserFixture.asServiceAdmin([serviceFixture]).toUser())
  .withStubs({
    '@utils/response': { response: mockResponse },
  })
  .build()

describe('Controller: settings/adyen-details/responsible-person/responsible-person', () => {
  describe('get', () => {
    describe('with valid session data', () => {
      beforeEach(async () => {
        const currentSession: Partial<ResponsiblePersonSession> = {
          firstName: 'Sam',
          lastName: 'Person',
          dobDay: '25',
          dobMonth: '12',
          dobYear: '1970',
        }

        nextRequest({
          session: {
            pageData: {
              responsiblePerson: currentSession,
            },
          },
        })

        await call('get')
      })

      it('should call the response function with the template path', () => {
        mockResponse.should.have.been.calledOnce
        mockResponse.should.have.been.calledWith(
          sinon.match.any,
          sinon.match.any,
          'simplified-account/settings/adyen-details/responsible-person/index'
        )
      })

      it('should call the response method with the backLink', () => {
        mockResponse.should.have.been.calledOnce
        const context = mockResponse.firstCall.lastArg as { backLink: string }
        sinon.assert.match(context, {
          backLink: formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
            SERVICE_EXTERNAL_ID,
            SERVICE_TYPE
          ),
        })
      })
    })
    describe('post', () => {
      beforeEach(async () => {
        res.redirect.resetHistory()

        nextRequest({
          session: {
            pageData: {
              responsiblePerson: {},
            },
          },
          body: {
            firstName: 'Sam',
            lastName: 'Person',
            dobDay: '25',
            dobMonth: '12',
            dobYear: '1970',
          },
        })

        await call('post')
      })

      it('should redirect to the responsible person address', () => {
        sinon.assert.calledOnceWithExactly(
          res.redirect,
          formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.settings.adyenDetails.responsiblePerson.address,
            SERVICE_EXTERNAL_ID,
            SERVICE_TYPE,
            GATEWAY_ACCOUNT.getSwitchingCredential().externalId
          )
        )
      })
    })
  })
})
