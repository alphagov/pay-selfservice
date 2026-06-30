import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import AgreementStatus from '@models/agreements/agreement-status'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'

const SERVICE_EXTERNAL_ID = 'service123abc'
const AGREEMENT_EXTERNAL_ID = 'agreement123def'
const GATEWAY_ACCOUNT_ID = 117
const GATEWAY_ACCOUNT_EXTERNAL_ID = 'account123abc'
const USER_EXTERNAL_ID = 'user123def'
const USER_EMAIL = 'scrooge.mcduck@pay.gov.uk'

const mockResponse = sinon.stub()

const mockAgreement = {
  externalId: AGREEMENT_EXTERNAL_ID,
  reference: 'test-agreement-ref',
  status: AgreementStatus.ACTIVE,
  paymentInstrument: {
    cardBrand: 'visa',
    lastDigitsCardNumber: '4242',
    expiryDate: '01/30',
  },
  description: 'Test agreement',
  userIdentifier: 'user456def',
}

const mockAgreementsService = {
  getAgreement: sinon.stub().resolves(mockAgreement),
  cancelAgreement: sinon.stub().resolves(),
}

const { nextRequest, call, res } = new ControllerTestBuilder(
  '@controllers/simplified-account/services/agreements/cancel/cancel-agreement.controller'
)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/agreements.service': mockAgreementsService,
  })
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount({
    id: GATEWAY_ACCOUNT_ID,
    externalId: GATEWAY_ACCOUNT_EXTERNAL_ID,
    type: GatewayAccountType.TEST,
  })
  .withUser({
    externalId: USER_EXTERNAL_ID,
    email: USER_EMAIL,
  })
  .build()

describe('controller: services/agreements/cancel', () => {
  describe('get', () => {
    describe('successful cancel agreement request', () => {
      beforeEach(async () => {
        nextRequest({
          params: { agreementExternalId: AGREEMENT_EXTERNAL_ID },
        })
        await call('get')
      })

      it('should call the response method', () => {
        sinon.assert.calledOnce(mockResponse)
      })

      it('should pass correct template path to the response method', () => {
        sinon.assert.calledWith(
          mockResponse,
          sinon.match.any,
          sinon.match.any,
          'simplified-account/services/agreements/cancel'
        )
      })

      it('should call getAgreement with correct parameters', () => {
        sinon.assert.calledWith(mockAgreementsService.getAgreement, AGREEMENT_EXTERNAL_ID, SERVICE_EXTERNAL_ID)
      })

      it('should set agreement data on the context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.agreement, mockAgreement)
      })

      it('should set backLink in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.backLink, sinon.match.string)
        sinon.assert.match(context.backLink, sinon.match(/agreements/))
        sinon.assert.match(context.backLink, sinon.match(new RegExp(AGREEMENT_EXTERNAL_ID)))
      })
    })
  })

  describe('post', () => {
    describe('with valid yes answer', () => {
      beforeEach(async () => {
        nextRequest({
          params: { agreementExternalId: AGREEMENT_EXTERNAL_ID },
          body: { cancelAgreement: 'yes' },
        })
        await call('post')
      })

      it('should call getAgreement with correct parameters', () => {
        sinon.assert.calledWith(mockAgreementsService.getAgreement, AGREEMENT_EXTERNAL_ID, SERVICE_EXTERNAL_ID)
      })

      it('should call cancelAgreement service', () => {
        sinon.assert.calledWith(
          mockAgreementsService.cancelAgreement,
          SERVICE_EXTERNAL_ID,
          GatewayAccountType.TEST,
          AGREEMENT_EXTERNAL_ID,
          sinon.match.has('email', USER_EMAIL).and(sinon.match.has('externalId', USER_EXTERNAL_ID))
        )
      })

      it('should redirect to agreement detail page', () => {
        sinon.assert.calledOnce(res.redirect)
        sinon.assert.calledWith(res.redirect, sinon.match(new RegExp(`/agreements/${AGREEMENT_EXTERNAL_ID}`)))
      })
    })

    describe('with valid no answer', () => {
      beforeEach(async () => {
        mockAgreementsService.cancelAgreement.resetHistory()
        res.redirect.resetHistory()
        nextRequest({
          params: { agreementExternalId: AGREEMENT_EXTERNAL_ID },
          body: { cancelAgreement: 'no' },
        })
        await call('post')
      })

      it('should not call cancelAgreement service', () => {
        sinon.assert.notCalled(mockAgreementsService.cancelAgreement)
      })

      it('should redirect to agreement detail page', () => {
        sinon.assert.calledOnce(res.redirect)
        sinon.assert.calledWith(res.redirect, sinon.match(new RegExp(`/agreements/${AGREEMENT_EXTERNAL_ID}`)))
      })
    })

    describe('with validation errors', () => {
      beforeEach(async () => {
        mockResponse.resetHistory()
        res.redirect.resetHistory()
        nextRequest({
          params: { agreementExternalId: AGREEMENT_EXTERNAL_ID },
          body: { cancelAgreement: '' },
        })
        await call('post')
      })

      it('should render the form with errors', () => {
        sinon.assert.calledOnce(mockResponse)
        sinon.assert.calledWith(
          mockResponse,
          sinon.match.any,
          sinon.match.any,
          'simplified-account/services/agreements/cancel'
        )
      })

      it('should include errors in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.errors, sinon.match.object)
        sinon.assert.match(context.errors, sinon.match.has('formErrors'))
        sinon.assert.match(context.errors, sinon.match.has('summary'))
      })

      it('should include agreement data in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.agreement, mockAgreement)
      })

      it('should include backLink in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.backLink, sinon.match.string)
        sinon.assert.match(context.backLink, sinon.match(new RegExp(`/agreements/${AGREEMENT_EXTERNAL_ID}`)))
      })

      it('should not redirect', () => {
        sinon.assert.notCalled(res.redirect)
      })

      it('should not call cancelAgreement service', () => {
        sinon.assert.notCalled(mockAgreementsService.cancelAgreement)
      })
    })
  })
})
