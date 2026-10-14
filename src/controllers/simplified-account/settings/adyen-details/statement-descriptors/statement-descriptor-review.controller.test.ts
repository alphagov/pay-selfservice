import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import { PaymentProvider } from '@models/constants/payment-provider'
import { UserFixture } from '@test/fixtures/user/user.fixture'
import { ServiceFixture } from '@test/fixtures/service/service.fixture'
import sinon from 'sinon'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { expect } from 'chai'
import { AdyenStatementDescriptorsSession } from './constants'

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
  '@controllers/simplified-account/settings/adyen-details/statement-descriptors/statement-descriptor-review.controller'
)
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount(GATEWAY_ACCOUNT)
  .withUser(UserFixture.asServiceAdmin([serviceFixture]).toUser())
  .withStubs({
    '@utils/response': { response: mockResponse },
  })
  .build()

describe('Controller: settings/adyen-details/statement-descriptors/statement-descriptor-review', () => {
  describe('get', () => {
    describe('with empty session data', () => {
      beforeEach(async () => {
        nextRequest({
          session: {},
        })

        await call('get')
      })
      it('should redirect to the Adyen migration task list', () => {
        sinon.assert.calledOnce(res.redirect)
        sinon.assert.calledWith(res.redirect, sinon.match(/switch-to-adyen/))
      })
    })

    describe('with valid session data', () => {
      beforeEach(async () => {
        const currentSession: Partial<AdyenStatementDescriptorsSession> = {
          userDescriptor: 'User descriptor',
          payoutDescriptor: 'Payout descriptor',
        }

        nextRequest({
          session: {
            pageData: {
              AdyenStatementDescriptors: currentSession,
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
          'simplified-account/settings/adyen-details/statement-descriptors/check-your-answers'
        )
      })

      it('should set review values from session in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const submittedAnswers = context.currentSession as Record<string, unknown>
        sinon.assert.match(submittedAnswers.userDescriptor, 'User descriptor')
        sinon.assert.match(submittedAnswers.payoutDescriptor, 'Payout descriptor')
      })

      it('should call the response method with the correct form action path, back, and change links', () => {
        mockResponse.should.have.been.calledOnce
        const context = mockResponse.firstCall.lastArg as { backLink: string }
        const fromReviewParam = '?fromReview=true'
        const payoutDescriptorLink = formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.settings.adyenDetails.statementDescriptors.payout,
          SERVICE_EXTERNAL_ID,
          SERVICE_TYPE,
          GATEWAY_ACCOUNT.getSwitchingCredential().externalId
        )

        const checkYourAnswersPath = formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.settings.adyenDetails.statementDescriptors.checkYourAnswers,
          SERVICE_EXTERNAL_ID,
          SERVICE_TYPE,
          GATEWAY_ACCOUNT.getSwitchingCredential().externalId
        )

        sinon.assert.match(context, {
          backLink: payoutDescriptorLink,
          formActionPath: checkYourAnswersPath,
          userDescriptorLink:
            formatServiceAndAccountPathsFor(
              paths.simplifiedAccount.settings.adyenDetails.statementDescriptors.user,
              SERVICE_EXTERNAL_ID,
              SERVICE_TYPE,
              GATEWAY_ACCOUNT.getSwitchingCredential().externalId
            ) + fromReviewParam,
          payoutDescriptorLink: payoutDescriptorLink + fromReviewParam,
          currentSession: new AdyenStatementDescriptorsSession({
            userDescriptor: 'User descriptor',
            payoutDescriptor: 'Payout descriptor',
          }),
        })
      })
    })
  })

  describe('post', () => {
    it('should remove the session and redirect to the Adyen migration task list', async () => {
      const currentSession: Partial<AdyenStatementDescriptorsSession> = {
        userDescriptor: 'User descriptor',
        payoutDescriptor: 'Payout descriptor',
      }

      nextRequest({
        session: {
          otherSessionData: 'keep',
          pageData: {
            AdyenStatementDescriptors: currentSession,
          },
        },
      })

      const thisCall = await call('post')

      expect(thisCall.req.session).to.deep.include({ otherSessionData: 'keep', pageData: {} })

      sinon.assert.calledOnceWithExactly(
        res.redirect,
        formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
          SERVICE_EXTERNAL_ID,
          SERVICE_TYPE
        )
      )
    })
  })
})
