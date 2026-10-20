import { expect } from 'chai'
import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import { PaymentProvider } from '@models/constants/payment-provider'
import { UserFixture } from '@test/fixtures/user/user.fixture'
import { ServiceFixture } from '@test/fixtures/service/service.fixture'
import sinon from 'sinon'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { ServiceDirectorSession } from './constants'
import { CredentialFixture } from '@test/fixtures/gateway-account/credential.fixture'

const SERVICE_EXTERNAL_ID = 'service123abc'
const ORGANISATION_LEGAL_ENTITY_ID = 'LE_ORG_123'
const SERVICE_TYPE = 'live'
const serviceFixture = new ServiceFixture({
  externalId: SERVICE_EXTERNAL_ID,
})
const GATEWAY_ACCOUNT = GatewayAccountFixture.forSwitchingPsp(
  PaymentProvider.STRIPE,
  PaymentProvider.ADYEN,
  [],
  [{ credentials: CredentialFixture.forAdyen({ legalEntityId: ORGANISATION_LEGAL_ENTITY_ID }) }],
  {
    type: 'live',
  }
).toGatewayAccount()

const mockResponse = sinon.stub()
const markTaskAsComplete = sinon.stub().resolves()
const createServiceDirector = sinon.stub()

const { nextRequest, res, call } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/adyen-details/service-director/service-director-check-your-answers.controller'
)
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount(GATEWAY_ACCOUNT)
  .withUser(UserFixture.asServiceAdmin([serviceFixture]).toUser())
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/adyen-setup.service': { markTaskAsComplete },
    '@services/adyen-details.service': { createServiceDirector },
  })
  .build()

describe('Controller: settings/adyen-details/service-director/service-director-check-your-answers', () => {
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
        const currentSession: Partial<ServiceDirectorSession> = {
          firstName: 'Sam',
          lastName: 'Person',
          dobDay: '25',
          dobMonth: '12',
          dobYear: '1970',
          email: 'sam.person@gov.example.com',
          addressLine1: '29 Acacia Road',
          addressCity: 'London',
          addressPostcode: 'W1 2AB',
        }

        nextRequest({
          session: {
            pageData: {
              serviceDirector: currentSession,
            },
          },
        })

        await call('get')
      })

      it('should call the response function the template path', () => {
        mockResponse.should.have.been.calledOnce
        mockResponse.should.have.been.calledWith(
          sinon.match.any,
          sinon.match.any,
          'simplified-account/settings/adyen-details/service-director/check-your-answers'
        )
      })

      it('should set review values from session in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const submittedAnswers = context.currentSession as Record<string, unknown>
        sinon.assert.match(submittedAnswers.firstName, 'Sam')
        sinon.assert.match(submittedAnswers.lastName, 'Person')
        sinon.assert.match(submittedAnswers.dobDay, '25')
        sinon.assert.match(submittedAnswers.dobMonth, '12')
        sinon.assert.match(submittedAnswers.dobYear, '1970')
        sinon.assert.match(submittedAnswers.email, 'sam.person@gov.example.com')
        sinon.assert.match(submittedAnswers.addressLine1, '29 Acacia Road')
        sinon.assert.match(submittedAnswers.addressCity, 'London')
        sinon.assert.match(submittedAnswers.addressPostcode, 'W1 2AB')
      })

      it('should call the response method with the back and change links', () => {
        mockResponse.should.have.been.calledOnce
        const context = mockResponse.firstCall.lastArg as { backLink: string }
        const fromReviewParam = '?fromReview=true'
        const addressLink = formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.settings.adyenDetails.serviceDirector.address,
          SERVICE_EXTERNAL_ID,
          SERVICE_TYPE,
          GATEWAY_ACCOUNT.getSwitchingCredential().externalId
        )

        sinon.assert.match(context, {
          backLink: addressLink + fromReviewParam,
          addressLink: addressLink + fromReviewParam,
          detailsLink:
            formatServiceAndAccountPathsFor(
              paths.simplifiedAccount.settings.adyenDetails.serviceDirector.details,
              SERVICE_EXTERNAL_ID,
              SERVICE_TYPE,
              GATEWAY_ACCOUNT.getSwitchingCredential().externalId
            ) + fromReviewParam,
        })
      })
    })
  })

  describe('post', () => {
    const VALID_SESSION: Partial<ServiceDirectorSession> = {
      firstName: 'Sam',
      lastName: 'Person',
      dobDay: '25',
      dobMonth: '12',
      dobYear: '1970',
      email: 'sam.person@gov.example.com',
      addressLine1: '29 Acacia Road',
      addressCity: 'London',
      addressPostcode: 'W1 2AB',
    }

    beforeEach(() => {
      markTaskAsComplete.resolves()
      createServiceDirector.resolves({ id: 'LE123', type: 'individual' })

      nextRequest({
        session: {
          otherSessionData: 'keep',
          pageData: {
            serviceDirector: VALID_SESSION,
          },
        },
      })
    })

    context('when the service director is succesfully created', () => {
      it('should create the service director', async () => {
        await call('post')
        sinon.assert.calledOnceWithExactly(
          createServiceDirector,
          new ServiceDirectorSession({
            firstName: 'Sam',
            lastName: 'Person',
            dobMonth: '12',
            dobDay: '25',
            dobYear: '1970',
            email: 'sam.person@gov.example.com',
            addressLine1: '29 Acacia Road',
            addressCity: 'London',
            addressPostcode: 'W1 2AB',
          } as ServiceDirectorSession),
          ORGANISATION_LEGAL_ENTITY_ID
        )
      })

      it('should complete the service director task and redirect to the Adyen migration task list', async () => {
        await call('post')
        sinon.assert.calledOnceWithExactly(
          markTaskAsComplete,
          SERVICE_EXTERNAL_ID,
          SERVICE_TYPE,
          GATEWAY_ACCOUNT.getSwitchingCredential().externalId,
          'director'
        )

        sinon.assert.calledOnceWithExactly(
          res.redirect,
          formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
            SERVICE_EXTERNAL_ID,
            SERVICE_TYPE
          )
        )
      })

      it('should clear the session service director details', async () => {
        const thisCall = await call('post')
        expect(thisCall.req.session).to.deep.include({ otherSessionData: 'keep', pageData: {} })
      })
    })

    context('when the service director cannot be created', () => {
      beforeEach(() => {
        createServiceDirector.rejects(new Error('Adyen error'))
      })
      it('should not complete task or redirect', async () => {
        await expect(call('post')).to.be.rejectedWith('Adyen error')
        sinon.assert.notCalled(markTaskAsComplete)
        sinon.assert.notCalled(res.redirect)
      })
    })
  })
})
