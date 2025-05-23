const sinon = require('sinon')
const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const { expect } = require('chai')
const GatewayAccountCredential = require('@models/gateway-account-credential/GatewayAccountCredential.class')
const { WORLDPAY, STRIPE } = require('@models/constants/payment-providers')
const { paths } = require('@root/routes')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const formatPSPName = require('@utils/format-PSP-name')
const { VERIFY_PSP_INTEGRATION_CHARGE_EXTERNAL_ID_KEY } = require('@utils/verify-psp-integration')
const ChargeRequest = require('@models/charge/ChargeRequest.class')
const { RESTClientError } = require('@govuk-pay/pay-js-commons/lib/utils/axios-base-client/errors')
const { CREDENTIAL_STATE } = require('@utils/credentials')
const Charge = require('@models/charge/Charge.class')
const { validChargeResponse } = require('@test/fixtures/charge.fixtures')

const ACCOUNT_TYPE = 'live'
const SWITCHING_CREDENTIAL_EXTERNAL_ID = 'credential-id-123abc'
const SWITCHING_CREDENTIAL_PAYMENT_PROVIDER = WORLDPAY
const SERVICE_EXTERNAL_ID = 'service-id-123abc'
const CHARGE_EXTERNAL_ID = 'charge-id-123abc'
const CHARGE_URL = 'https://payment.gov.uk/blahblahblah'
const USER_EXTERNAL_ID = 'user-id-123abc'

const mockResponse = sinon.spy()
const mockChargeService = {
  createCharge: sinon.stub().resolves(
    new Charge(
      validChargeResponse({
        chargeId: CHARGE_EXTERNAL_ID,
        links: [
          {
            rel: 'next_url',
            href: CHARGE_URL,
          },
        ],
      })
    )
  ),
  getCharge: sinon.stub().resolves(
    new Charge(
      validChargeResponse({
        chargeId: CHARGE_EXTERNAL_ID,
        state: {
          status: 'success',
          finished: true,
        },
      })
    )
  ),
}
const mockWorldpayDetailsService = {
  updateCredentialState: sinon.stub().resolves(),
}

const { req, res, next, nextRequest, call } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/switch-psp/make-test-payment/make-test-payment.controller'
)
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount({
    type: ACCOUNT_TYPE,
    providerSwitchEnabled: true,
    paymentProvider: STRIPE,
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
    '@services/charge.service': mockChargeService,
    '@services/worldpay-details.service': mockWorldpayDetailsService,
  })
  .build()

describe('Controller: settings/switch-psp/switch-to-worldpay/make-a-test-payment', () => {
  describe('get', () => {
    before(() => {
      call('get')
    })

    it('should call the response method', () => {
      sinon.assert.calledOnce(mockResponse)
    })

    it('should pass req, res and template path to the response method', () => {
      sinon.assert.calledWith(mockResponse, req, res, 'simplified-account/settings/switch-psp/make-test-payment/index')
    })

    it('should pass the context data to the response method', () => {
      const context = mockResponse.args[0][3]
      sinon.assert.match(context, {
        backLink: formatSimplifiedAccountPathsFor(
          paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index,
          SERVICE_EXTERNAL_ID,
          ACCOUNT_TYPE
        ),
      })
    })
  })

  describe('getInbound', () => {
    describe('when payment is successful', () => {
      before(() => {
        nextRequest({
          session: {
            [VERIFY_PSP_INTEGRATION_CHARGE_EXTERNAL_ID_KEY]: CHARGE_EXTERNAL_ID,
          },
        })
        call('getInbound')
      })

      it('should update the credential state', () => {
        sinon.assert.calledOnceWithExactly(
          mockWorldpayDetailsService.updateCredentialState,
          SERVICE_EXTERNAL_ID,
          ACCOUNT_TYPE,
          SWITCHING_CREDENTIAL_EXTERNAL_ID,
          USER_EXTERNAL_ID,
          CREDENTIAL_STATE.VERIFIED
        )
      })

      it('should set success message', () => {
        sinon.assert.calledOnceWithExactly(req.flash, 'messages', {
          state: 'success',
          icon: '&check;',
          heading: 'Payment verified',
          body: `This service is ready to switch to ${formatPSPName(SWITCHING_CREDENTIAL_PAYMENT_PROVIDER)}`,
        })
      })

      it('should call next', () => {
        sinon.assert.calledOnce(next)
      })
    })
    describe('when payment is not successful', () => {
      before(() => {
        mockChargeService.getCharge.resolves({
          state: {
            status: 'error',
          },
        })
        nextRequest({
          session: {
            [VERIFY_PSP_INTEGRATION_CHARGE_EXTERNAL_ID_KEY]: CHARGE_EXTERNAL_ID,
          },
        })
        call('getInbound')
      })

      it('should set error message', () => {
        sinon.assert.calledOnceWithExactly(req.flash, 'messages', {
          state: 'error',
          heading: 'There is a problem',
          body: 'The payment has failed, please try again. If you need help, contact govuk-pay-support@digital.cabinet-office.gov.uk',
        })
      })

      it('should call next', () => {
        sinon.assert.calledOnce(next)
      })
    })
    describe('when there is no charge present in the session', () => {
      it('should throw an error', async () => {
        await expect(call('getInbound')).to.be.rejectedWith(Error, 'No charge found on session')
        sinon.assert.notCalled(res.redirect)
      })
    })
    describe('when there is a problem retrieving the charge', () => {
      before(() => {
        const error = new RESTClientError('whoops')
        mockChargeService.getCharge.rejects(error)
        nextRequest({
          session: {
            [VERIFY_PSP_INTEGRATION_CHARGE_EXTERNAL_ID_KEY]: CHARGE_EXTERNAL_ID,
          },
        })
        call('getInbound')
      })
      it('should call next with error', () => {
        sinon.assert.notCalled(res.redirect)
        sinon.assert.calledOnceWithMatch(
          next,
          sinon.match.instanceOf(RESTClientError).and(sinon.match.has('message', 'whoops'))
        )
      })
    })
    describe('when there is a problem updating the credential', () => {
      before(() => {
        const error = new RESTClientError('whoops')
        mockWorldpayDetailsService.updateCredentialState.rejects(error)
        nextRequest({
          session: {
            [VERIFY_PSP_INTEGRATION_CHARGE_EXTERNAL_ID_KEY]: CHARGE_EXTERNAL_ID,
          },
        })
        call('getInbound')
      })
      it('should call next with error', () => {
        sinon.assert.notCalled(res.redirect)
        sinon.assert.calledOnceWithMatch(
          next,
          sinon.match.instanceOf(RESTClientError).and(sinon.match.has('message', 'whoops'))
        )
      })
    })
  })

  describe('post', () => {
    before(() => {
      call('post')
    })

    it('should create a charge via the charge service', () => {
      sinon.assert.calledOnceWithMatch(
        mockChargeService.createCharge,
        SERVICE_EXTERNAL_ID,
        ACCOUNT_TYPE,
        sinon.match
          .instanceOf(ChargeRequest)
          .and(
            sinon.match.has(
              'amount',
              200,
              'reference',
              'VERIFY_PSP_INTEGRATION',
              'credentialExternalId',
              SWITCHING_CREDENTIAL_EXTERNAL_ID
            )
          )
      )
    })

    it('should set the charge id on the session', () => {
      expect(req.session[VERIFY_PSP_INTEGRATION_CHARGE_EXTERNAL_ID_KEY]).to.equal(CHARGE_EXTERNAL_ID)
    })

    it('should redirect the user to make a payment', () => {
      sinon.assert.calledOnceWithExactly(res.redirect, CHARGE_URL)
    })

    describe('when there is a problem creating the charge', () => {
      before(() => {
        const error = new RESTClientError('whoops')
        mockChargeService.createCharge.rejects(error)
        call('post')
      })

      it('should call next with error', () => {
        sinon.assert.calledOnceWithMatch(
          next,
          sinon.match.instanceOf(RESTClientError).and(sinon.match.has('message', 'whoops'))
        )
      })
    })
  })
})
