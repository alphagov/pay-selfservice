import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import { PaymentProvider } from '@models/constants/payment-provider'
import { UserFixture } from '@test/fixtures/user/user.fixture'
import { ServiceFixture } from '@test/fixtures/service/service.fixture'
import sinon from 'sinon'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { ResponsiblePersonSession } from './constants'
import { CredentialFixture } from '@test/fixtures/gateway-account/credential.fixture'
import { expect } from 'chai'

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
  { type: 'live' }
).toGatewayAccount()

const mockResponse = sinon.stub()
const markTaskAsComplete = sinon.stub().resolves()
const createResponsiblePerson = sinon.stub()

const { nextRequest, res, call } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/adyen-details/responsible-person/responsible-person-review.controller'
)
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount(GATEWAY_ACCOUNT)
  .withUser(UserFixture.asServiceAdmin([serviceFixture]).toUser())
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/adyen-setup.service': { markTaskAsComplete },
    '@services/adyen-details.service': { createResponsiblePerson },
  })
  .build()

describe('Controller: settings/adyen-details/responsible-person/responsible-person-review', () => {
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
        const currentSession: Partial<ResponsiblePersonSession> = {
          firstName: 'Sam',
          lastName: 'Person',
          dobDay: '25',
          dobMonth: '12',
          dobYear: '1970',
          addressLine1: '29 Acacia Road',
          addressCity: 'London',
          addressPostcode: 'W1 2AB',
          telephoneNumber: '07700 700900',
          email: 'sam@example.com',
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
          'simplified-account/settings/adyen-details/responsible-person/check-your-answers'
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
        sinon.assert.match(submittedAnswers.addressLine1, '29 Acacia Road')
        sinon.assert.match(submittedAnswers.addressCity, 'London')
        sinon.assert.match(submittedAnswers.addressPostcode, 'W1 2AB')
        sinon.assert.match(submittedAnswers.telephoneNumber, '07700 700900')
        sinon.assert.match(submittedAnswers.email, 'sam@example.com')
      })

      it('should call the response method with the back and change links', () => {
        mockResponse.should.have.been.calledOnce
        const context = mockResponse.firstCall.lastArg as { backLink: string }
        const fromReviewParam = '?fromReview=true'
        const contactDetailsLink = formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.settings.adyenDetails.responsiblePerson.contactDetails,
          SERVICE_EXTERNAL_ID,
          SERVICE_TYPE,
          GATEWAY_ACCOUNT.getSwitchingCredential().externalId
        )

        sinon.assert.match(context, {
          backLink: contactDetailsLink + fromReviewParam,
          detailsLink:
            formatServiceAndAccountPathsFor(
              paths.simplifiedAccount.settings.adyenDetails.responsiblePerson.index,
              SERVICE_EXTERNAL_ID,
              SERVICE_TYPE,
              GATEWAY_ACCOUNT.getSwitchingCredential().externalId
            ) + fromReviewParam,
          contactDetailsLink: contactDetailsLink + fromReviewParam,
          addressLink:
            formatServiceAndAccountPathsFor(
              paths.simplifiedAccount.settings.adyenDetails.responsiblePerson.address,
              SERVICE_EXTERNAL_ID,
              SERVICE_TYPE,
              GATEWAY_ACCOUNT.getSwitchingCredential().externalId
            ) + fromReviewParam,
        })
      })
    })
  })

  describe('post', () => {
    const currentSession: Partial<ResponsiblePersonSession> = {
      firstName: 'Sam',
      lastName: 'Person',
      dobDay: '25',
      dobMonth: '12',
      dobYear: '1970',
      addressLine1: '29 Acacia Road',
      addressCity: 'London',
      addressPostcode: 'W1 2AB',
      telephoneNumber: '07700 700900',
      email: 'sam@example.com',
    }

    const withSession = () => ({
      session: {
        pageData: {
          responsiblePerson: currentSession,
        },
      },
    })

    beforeEach(() => {
      createResponsiblePerson.resolves({ id: 'LE_PERSON_456', type: 'individual' })
      markTaskAsComplete.resolves()
    })

    describe('with a session and an organisation legal entity ID', () => {
      beforeEach(async () => {
        nextRequest(withSession())

        await call('post')
      })

      it('should create the responsible person using the session and the organisation legal entity ID', () => {
        sinon.assert.calledOnceWithExactly(
          createResponsiblePerson,
          sinon.match(currentSession),
          ORGANISATION_LEGAL_ENTITY_ID
        )
      })
      it('should complete the responsible person task and redirect to the Adyen migration task list', async () => {
        sinon.assert.calledOnceWithExactly(
          markTaskAsComplete,
          SERVICE_EXTERNAL_ID,
          SERVICE_TYPE,
          GATEWAY_ACCOUNT.getSwitchingCredential().externalId,
          'responsiblePerson'
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
      it('should create the responsible person before completing the task', () => {
        sinon.assert.callOrder(createResponsiblePerson, markTaskAsComplete)
      })
    })

    describe('when creating the responsible person fails', () => {
      it('should not complete task or redirect', async () => {
        createResponsiblePerson.rejects(new Error('Adyen error'))
        nextRequest(withSession())
        await expect(call('post')).to.be.rejectedWith('Adyen error')
        sinon.assert.notCalled(markTaskAsComplete)
        sinon.assert.notCalled(res.redirect)
      })
    })
    describe('when no organisation legal entity ID exists', () => {
      const GATEWAY_ACCOUNT_NO_LE = GatewayAccountFixture.forSwitchingPsp(
        PaymentProvider.STRIPE,
        PaymentProvider.ADYEN,
        [],
        [],
        { type: 'live' }
      ).toGatewayAccount()

      const { nextRequest: nextRequestNoLe, call: callNoLe } = new ControllerTestBuilder(
        '@controllers/simplified-account/settings/adyen-details/responsible-person/responsible-person-review.controller'
      )
        .withServiceExternalId(SERVICE_EXTERNAL_ID)
        .withAccount(GATEWAY_ACCOUNT_NO_LE)
        .withUser(UserFixture.asServiceAdmin([serviceFixture]).toUser())
        .withStubs({
          '@utils/response': { response: mockResponse },
          '@services/adyen-setup.service': { markTaskAsComplete },
          '@services/adyen-details.service': { createResponsiblePerson },
        })
        .build()

      it('should throw an error', async () => {
        nextRequestNoLe(withSession())
        await expect(callNoLe('post')).to.be.rejectedWith(
          'Cannot create responsible person: no Adyen legal entity ID on the switching credential'
        )
      })
    })
  })
})
