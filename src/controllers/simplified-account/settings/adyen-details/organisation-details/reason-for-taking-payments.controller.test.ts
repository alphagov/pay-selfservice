import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import { PaymentProvider } from '@models/constants/payment-provider'
import { UserFixture } from '@test/fixtures/user/user.fixture'
import { ServiceFixture } from '@test/fixtures/service/service.fixture'
import sinon from 'sinon'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { OrganisationDetailsSession } from './constants'

const SERVICE_EXTERNAL_ID = 'service123abc'
const SERVICE_TYPE = 'live'
const serviceFixture = new ServiceFixture({
  externalId: SERVICE_EXTERNAL_ID,
})

const GATEWAY_ACCOUNT = GatewayAccountFixture.forSwitchingPsp(PaymentProvider.STRIPE, PaymentProvider.ADYEN, [], [], {
  type: 'live',
}).toGatewayAccount()
const USER = UserFixture.asServiceAdmin([serviceFixture], { externalId: 'user123abc' }).toUser()

const mockResponse = sinon.stub()
const createOrganisation = sinon.stub().resolves()
const markTaskAsComplete = sinon.stub().resolves()

const TEMPLATE = 'simplified-account/settings/adyen-details/reason-for-taking-payments'
const BACK_LINK = formatServiceAndAccountPathsFor(
  paths.simplifiedAccount.settings.adyenDetails.organisationDetails.vatRegistration,
  SERVICE_EXTERNAL_ID,
  SERVICE_TYPE,
  GATEWAY_ACCOUNT.getSwitchingCredential().externalId
)

const { req, res, call, nextRequest } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/adyen-details/organisation-details/reason-for-taking-payments.controller.ts'
)
  .withService(serviceFixture.toService())
  .withAccount(GATEWAY_ACCOUNT)
  .withUser(USER)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/adyen-details.service': { createOrganisation },
    '@services/adyen-setup.service': { markTaskAsComplete },
  })
  .build()

const VALID_SESSION: Partial<OrganisationDetailsSession> = {
  organisationName: 'Test Organisation',
  addressLine1: '1 Test Street',
  addressCity: 'swansea',
  addressPostcode: 'T3 5TT',
  addressCountry: 'GB',
  companyRegistrationNumber: '01234567',
  vatRegistrationNumber: 'GB123456789',
}

describe('Controller: settings/adyen-details/reason-for-taking-payments', () => {
  describe('get', () => {
    describe('with no organisation details in session', () => {
      beforeEach(async () => {
        nextRequest({ session: {} })
        await call('get')
      })

      it('should redirect to the switch to adyen task list', () => {
        sinon.assert.calledOnceWithMatch(res.redirect, sinon.match(/switch-to-adyen/))
      })
    })

    describe('with organisation details already in session', () => {
      beforeEach(async () => {
        nextRequest({
          session: {
            pageData: {
              organisationDetails: VALID_SESSION,
            },
          },
        })
        await call('get')
      })

      it('should call the response function with the template path', () => {
        sinon.assert.calledOnceWithMatch(mockResponse, sinon.match.any, sinon.match.any, TEMPLATE)
      })

      it('should call the response method with the backLink', () => {
        const expectedContext = {
          backLink: BACK_LINK,
        }
        sinon.assert.calledOnceWithMatch(mockResponse, req, res, TEMPLATE, expectedContext)
      })
    })
  })
  describe('post', () => {
    describe('when a selection is made', () => {
      beforeEach(() => {
        nextRequest({
          body: {
            takingPaymentsFor: 'government-activities',
          },
          session: {
            pageData: {
              organisationDetails: VALID_SESSION,
            },
          },
        })
      })
      it('should create Adyen legal entity and mark organisation details task as complete and redirect to the switch to adyen task list', async () => {
        await call('post')

        sinon.assert.calledOnceWithExactly(
          createOrganisation,
          new OrganisationDetailsSession(VALID_SESSION as OrganisationDetailsSession),
          serviceFixture.name,
          SERVICE_EXTERNAL_ID,
          GATEWAY_ACCOUNT.type,
          GATEWAY_ACCOUNT.getSwitchingCredential().externalId,
          USER.externalId
        )

        sinon.assert.calledOnceWithExactly(
          markTaskAsComplete,
          SERVICE_EXTERNAL_ID,
          SERVICE_TYPE,
          GATEWAY_ACCOUNT.getSwitchingCredential().externalId,
          'organisationDetails'
        )

        sinon.assert.callOrder(createOrganisation, markTaskAsComplete)

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
    describe('when no selection is made', () => {
      beforeEach(() => {
        nextRequest({
          body: {},
          session: {
            pageData: {
              organisationDetails: VALID_SESSION,
            },
          },
        })
      })
      it('should not complete the task, create an organisation or redirect', async () => {
        await call('post')
        sinon.assert.notCalled(markTaskAsComplete)
        sinon.assert.notCalled(createOrganisation)
        sinon.assert.notCalled(res.redirect)
      })
      it('should re-render the taking payments for page with the backLink', async () => {
        await call('post')
        const expectedContext = { backLink: BACK_LINK }
        sinon.assert.calledOnceWithMatch(mockResponse, req, res, TEMPLATE, expectedContext)
      })
      it('should show the summary error', async () => {
        await call('post')
        const expectedContext = {
          errors: { summary: [{ text: 'You must make a selection', href: '#taking-payments-for' }] },
        }
        sinon.assert.calledOnceWithMatch(mockResponse, req, res, TEMPLATE, expectedContext)
      })
    })
  })
})
