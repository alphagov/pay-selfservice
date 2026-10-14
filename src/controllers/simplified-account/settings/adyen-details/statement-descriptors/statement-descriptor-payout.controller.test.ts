import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import { PaymentProvider } from '@models/constants/payment-provider'
import { UserFixture } from '@test/fixtures/user/user.fixture'
import { ServiceFixture } from '@test/fixtures/service/service.fixture'
import sinon, { SinonSpyCall } from 'sinon'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { expect } from 'chai'
import paths from '@root/paths'
import _ from 'lodash'
import { FROM_REVIEW_QUERY_PARAM } from './constants'

const SERVICE_EXTERNAL_ID = 'service123abc'
const SERVICE_TYPE = 'live'
const serviceFixture = new ServiceFixture({
  externalId: SERVICE_EXTERNAL_ID,
})
const GATEWAY_ACCOUNT = GatewayAccountFixture.forSwitchingPsp(PaymentProvider.STRIPE, PaymentProvider.ADYEN, [], [], {
  type: 'live',
}).toGatewayAccount()

const mockResponse = sinon.stub()

const { call, res, nextRequest } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/adyen-details/statement-descriptors/statement-descriptor-payout.controller'
)
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount(GATEWAY_ACCOUNT)
  .withUser(UserFixture.asServiceAdmin([serviceFixture]).toUser())
  .withStubs({
    '@utils/response': { response: mockResponse },
  })
  .build()

describe('Controller: settings/adyen-details/statement-descriptor/payout', () => {
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
    context('given a valid session', () => {
      beforeEach(async () => {
        nextRequest({
          session: {
            pageData: {
              AdyenStatementDescriptors: {
                payoutDescriptor: 'payout descriptor',
              },
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
          'simplified-account/settings/adyen-details/statement-descriptors/payout'
        )
      })

      it('should call the response method with the backLink set to the user statement descriptor page', () => {
        mockResponse.should.have.been.calledOnce
        const context = mockResponse.firstCall.lastArg as { backLink: string }
        sinon.assert.match(context, {
          backLink: formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.settings.adyenDetails.statementDescriptors.user,
            SERVICE_EXTERNAL_ID,
            SERVICE_TYPE,
            GATEWAY_ACCOUNT.getSwitchingCredential().externalId
          ),
        })
      })

      it('formActionPath is correct', () => {
        mockResponse.should.have.been.calledOnce
        const context = mockResponse.firstCall.lastArg as { formActionPath: string }

        const userDescriptorPath = formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.settings.adyenDetails.statementDescriptors.payout,
          SERVICE_EXTERNAL_ID,
          SERVICE_TYPE,
          GATEWAY_ACCOUNT.getSwitchingCredential().externalId
        )

        sinon.assert.match(context, {
          formActionPath: sinon.match(userDescriptorPath),
        })
      })
    })

    context('when coming from the check your answers page', () => {
      beforeEach(async () => {
        res.redirect.resetHistory()

        nextRequest({
          query: { [FROM_REVIEW_QUERY_PARAM]: 'true' },
          session: {
            pageData: {
              AdyenStatementDescriptors: {
                userDescriptor: 'user descriptor',
                payoutDescriptor: 'payout descriptor',
              },
            },
          },
        })

        await call('get')
      })

      it('should call the response method with the backLink set to the check your answers page', () => {
        mockResponse.should.have.been.calledOnce
        const context = mockResponse.firstCall.lastArg as { backLink: string }
        sinon.assert.match(context, {
          backLink: formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.settings.adyenDetails.statementDescriptors.checkYourAnswers,
            SERVICE_EXTERNAL_ID,
            SERVICE_TYPE,
            GATEWAY_ACCOUNT.getSwitchingCredential().externalId
          ),
        })
      })
    })
  })

  describe('post', () => {
    let thisCall: { req: unknown; res: { redirect: SinonSpyCall } }

    context('given a valid request body', () => {
      beforeEach(async () => {
        res.redirect.resetHistory()

        nextRequest({
          session: {
            pageData: {},
          },
          body: {
            payoutDescriptor: 'payout descriptor',
          },
        })

        thisCall = await call('post')
      })

      it('should redirect to the next page in the sequence', () => {
        sinon.assert.calledOnceWithExactly(
          res.redirect,
          formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.settings.adyenDetails.statementDescriptors.checkYourAnswers,
            SERVICE_EXTERNAL_ID,
            SERVICE_TYPE,
            GATEWAY_ACCOUNT.getSwitchingCredential().externalId
          )
        )
      })

      it('should set the payoutDescriptor in the session', () => {
        expect(_.get(thisCall.req, 'session.pageData.AdyenStatementDescriptors')).to.include({
          payoutDescriptor: 'payout descriptor',
        })
      })
    })
  })
})
