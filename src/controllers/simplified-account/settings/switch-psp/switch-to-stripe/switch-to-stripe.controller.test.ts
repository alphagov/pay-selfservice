import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import GatewayAccountCredential from '@models/gateway-account-credential/GatewayAccountCredential.class'
import { STRIPE, WORLDPAY } from '@models/constants/payment-providers'
import sinon from 'sinon'
import StripeAccountSetup from '@models/StripeAccountSetup.class'
import { buildGetStripeAccountSetupResponse } from '@test/fixtures/stripe-account-setup.fixtures'
import CredentialState from '@models/constants/credential-state'
import GatewayAccountSwitchPaymentProviderRequest
  from '@models/gateway-account/GatewayAccountSwitchPaymentProviderRequest.class'
import formatPSPName from '@utils/format-PSP-name'
import { formatSimplifiedAccountPathsFor } from '@utils/simplified-account/format'
import paths from '@root/paths'
// @ts-expect-error pay js commons is not typescript ready
import { RESTClientError } from '@govuk-pay/pay-js-commons/lib/utils/axios-base-client/errors'

const ACCOUNT_TYPE = 'live'
const ACCOUNT_EXTERNAL_ID = 'account123abc'
const USER_EXTERNAL_ID = 'user123abc'
const SWITCHING_CREDENTIAL_EXTERNAL_ID = 'credential456def'
const SWITCHING_CREDENTIAL_PAYMENT_PROVIDER = STRIPE
const SERVICE_EXTERNAL_ID = 'service123abc'
const ALL_TASKS_COMPLETED_RESPONSE = buildGetStripeAccountSetupResponse({
  bank_account: true,
  responsible_person: true,
  company_number: true,
  government_entity_document: true,
  vat_number: true,
  director: true,
  organisation_details: true
})

const mockResponse = sinon.spy()
const mockStripeDetailsService = {
  getConnectorStripeAccountSetup: sinon.stub().resolves(new StripeAccountSetup(buildGetStripeAccountSetupResponse())),
}
const mockGatewayAccountsService = {
  completePaymentServiceProviderSwitch: sinon.stub().resolves(),
}

const { req, res, next, nextRequest, nextResponse, call } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/switch-psp/switch-to-stripe/switch-to-stripe.controller'
)
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount({
    externalId: ACCOUNT_EXTERNAL_ID,
    type: ACCOUNT_TYPE,
    providerSwitchEnabled: true,
    paymentProvider: WORLDPAY,
    allowMoto: true,
    getSwitchingCredential: () => {
      return new GatewayAccountCredential()
        .withExternalId(SWITCHING_CREDENTIAL_EXTERNAL_ID)
        .withPaymentProvider(SWITCHING_CREDENTIAL_PAYMENT_PROVIDER)
    },
  })
  .withUser({
    externalId: USER_EXTERNAL_ID,
  })
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/gateway-accounts.service': mockGatewayAccountsService,
    '@services/stripe-details.service': mockStripeDetailsService,
  })
  .build()

describe('Controller: settings/switch-psp/switch-to-stripe', () => {
  describe('get', () => {
    before(async () => {
      await call('get')
    })

    it('should call the response method', () => {
      sinon.assert.calledOnce(mockResponse)
    })

    it('should pass req, res and template path to the response method', () => {
      sinon.assert.calledWith(mockResponse, req, res, 'simplified-account/settings/switch-psp/switch-to-stripe/index')
    })

    it('should pass the context data to the response method', () => {
      const context = mockResponse.args[0][3] as object

      sinon.assert.match(context, {
        messages: [],
        currentPsp: WORLDPAY,
        incompleteTasks: true,
        tasks: containsObjects([
          {
            linkText: 'Responsible person',
            href: '/service/service123abc/account/live/settings/stripe-details/responsible-person',
            id: 'stripe-responsible-person',
            status: 'NOT_STARTED',
          },
          {
            linkText: 'Government entity document',
            href: '/service/service123abc/account/live/settings/stripe-details/government-entity-document',
            id: 'stripe-gov-entity-doc',
            status: 'CANNOT_START',
          },
          {
            linkText: 'Make a live payment to test your Stripe PSP',
            href: '/service/service123abc/account/live/settings/switch-psp/make-a-payment',
            id: 'make-a-live-payment',
            status: 'CANNOT_START',
          },
        ]),
        stripeVerificationPending: false,
      })
    })

    describe('when stripe verification is pending', () => {
      before(async () => {
        mockStripeDetailsService.getConnectorStripeAccountSetup.resolves(
          new StripeAccountSetup(ALL_TASKS_COMPLETED_RESPONSE)
        )
        nextRequest({
          account: {
            getSwitchingCredential: () => {
              return new GatewayAccountCredential()
                .withExternalId(SWITCHING_CREDENTIAL_EXTERNAL_ID)
                .withPaymentProvider(SWITCHING_CREDENTIAL_PAYMENT_PROVIDER)
                .withState(CredentialState.CREATED)
            }
          }
        })
        await call('get')
      })

      it('the live payment task is unavailable', () => {
        const context = mockResponse.args[0][3] as object

        sinon.assert.match(context, {
          stripeVerificationPending: true,
          incompleteTasks: true,
          tasks: containsObjects([
            {
              linkText: 'Government entity document',
              href: '/service/service123abc/account/live/settings/stripe-details/government-entity-document',
              id: 'stripe-gov-entity-doc',
              status: 'COMPLETED_CANNOT_START',
            },
            {
              linkText: 'Make a live payment to test your Stripe PSP',
              href: '/service/service123abc/account/live/settings/switch-psp/make-a-payment',
              id: 'make-a-live-payment',
              status: 'CANNOT_START',
            },
          ]),
        })
      })
    })

    describe('when stripe verification is successful', () => {
      before(async () => {
        mockStripeDetailsService.getConnectorStripeAccountSetup.resolves(
          new StripeAccountSetup(ALL_TASKS_COMPLETED_RESPONSE)
        )
        nextRequest({
          account: {
            getSwitchingCredential: () => {
              return new GatewayAccountCredential()
                .withExternalId(SWITCHING_CREDENTIAL_EXTERNAL_ID)
                .withPaymentProvider(SWITCHING_CREDENTIAL_PAYMENT_PROVIDER)
                .withState(CredentialState.ENTERED)
            }
          }
        })
        await call('get')
      })

      it('the live payment task is available', () => {
        const context = mockResponse.args[0][3] as object

        sinon.assert.match(context, {
          stripeVerificationPending: false,
          incompleteTasks: true,
          tasks: containsObjects([
            {
              linkText: 'Make a live payment to test your Stripe PSP',
              href: '/service/service123abc/account/live/settings/switch-psp/make-a-payment',
              id: 'make-a-live-payment',
              status: 'NOT_STARTED',
            },
          ]),
        })
      })
    })

    describe('when all tasks are complete', () => {
      before(async () => {
        mockStripeDetailsService.getConnectorStripeAccountSetup.resolves(
          new StripeAccountSetup(ALL_TASKS_COMPLETED_RESPONSE)
        )
        nextRequest({
          account: {
            getSwitchingCredential: () => {
              return new GatewayAccountCredential()
                .withExternalId(SWITCHING_CREDENTIAL_EXTERNAL_ID)
                .withPaymentProvider(SWITCHING_CREDENTIAL_PAYMENT_PROVIDER)
                .withState(CredentialState.VERIFIED)
            }
          }
        })
        await call('get')
      })

      it('should set the context object appropriately', () => {
        const context = mockResponse.args[0][3] as object

        sinon.assert.match(context, {
          stripeVerificationPending: false,
          incompleteTasks: false,
        })
      })
    })

    describe('when messages are available', () => {
      before(async () => {
        nextResponse({
          locals: {
            flash: {
              messages: 'blah',
            },
          },
        })
        await call('get')
      })

      it('should pass messages to the response method', () => {
        sinon.assert.match(mockResponse.args[0][3], { messages: 'blah' })
      })
    })
  })

  describe('post', () => {
    describe('when all tasks are complete', () => {
      before(async () => {
        mockStripeDetailsService.getConnectorStripeAccountSetup.resolves(
          new StripeAccountSetup(ALL_TASKS_COMPLETED_RESPONSE)
        )
        nextRequest({
          account: {
            getSwitchingCredential: () => {
              return new GatewayAccountCredential()
                .withExternalId(SWITCHING_CREDENTIAL_EXTERNAL_ID)
                .withPaymentProvider(SWITCHING_CREDENTIAL_PAYMENT_PROVIDER)
                .withState(CredentialState.VERIFIED)
            }
          }
        })
        await call('post')
      })

      it('should call completePspSwitch', () => {
        const expectedRequest = new GatewayAccountSwitchPaymentProviderRequest()
          .withUserExternalId(USER_EXTERNAL_ID)
          .withGatewayAccountCredentialExternalId(SWITCHING_CREDENTIAL_EXTERNAL_ID)
        sinon.assert.calledOnceWithExactly(mockGatewayAccountsService.completePaymentServiceProviderSwitch,
          SERVICE_EXTERNAL_ID,
          ACCOUNT_TYPE,
          expectedRequest
        )
      })

      it('should set success message', () => {
        sinon.assert.calledOnceWithExactly(req.flash,
          'messages', {
            state: 'success',
            icon: '&check;',
            heading: `Service connected to ${formatPSPName(SWITCHING_CREDENTIAL_PAYMENT_PROVIDER)}`,
            body: 'This service can now take payments'
          }
        )
      })

      it('should redirect to stripe settings index', () => {
        sinon.assert.calledOnceWithExactly(res.redirect,
          formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.index, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE)
        )
      })
    })

    describe('when all tasks are not complete', () => {
      before(async () => {
        await call('post')
      })

      it('should set error message', () => {
        sinon.assert.calledOnceWithExactly(req.flash,
          'messages', {
            state: 'error',
            heading: 'There is a problem',
            body: 'You cannot switch providers until all required tasks are completed'
          }
        )
      })

      it('should redirect to switch to stripe tasks index', () => {
        sinon.assert.calledOnceWithExactly(res.redirect,
          formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.switchPsp.switchToStripe.index, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE)
        )
      })
    })

    describe('when there is a problem talking to connector', () => {
      before(async () => {
        nextRequest({
          account: {
            getSwitchingCredential: () => {
              return new GatewayAccountCredential()
                .withExternalId(SWITCHING_CREDENTIAL_EXTERNAL_ID)
                .withPaymentProvider(SWITCHING_CREDENTIAL_PAYMENT_PROVIDER)
                .withState(CredentialState.VERIFIED)
            }
          }
        })
        // pay js commons is not typescript ready
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        const error = new RESTClientError('whoops')
        mockGatewayAccountsService.completePaymentServiceProviderSwitch.rejects(error)
        await call('post')
      })

      it('should call next with error', () => {
        sinon.assert.calledOnceWithMatch(next,
          sinon.match.instanceOf(RESTClientError)
            .and(sinon.match.has('message', 'whoops'))
        )
      })
    })
  })
})

function containsObjects(expectedObjects: object[]) {
  return sinon.match((array) => {
    return (
      Array.isArray(array) &&
      expectedObjects.every((expectedObj) => array.some((item) => sinon.match(expectedObj).test(item)))
    )
  })
}
