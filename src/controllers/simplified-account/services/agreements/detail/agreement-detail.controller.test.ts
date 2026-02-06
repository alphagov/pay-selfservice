import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import AgreementStatus from '@models/agreements/agreement-status'
import { DateTime } from 'luxon'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'

const SERVICE_EXTERNAL_ID = 'service123abc'
const AGREEMENT_EXTERNAL_ID = 'agreement123abc'
const GATEWAY_ACCOUNT_ID = 117
const GATEWAY_ACCOUNT_EXTERNAL_ID = 'account123external'

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

const mockTransactions = {
  transactions: [
    {
      externalId: 'tx123',
      amount: 1000,
      state: 'success',
      createdDate: DateTime.now(),
    },
  ],
}

const mockAgreementsService = {
  getAgreement: sinon.stub().resolves(mockAgreement),
  getLatestTransactionsForAgreement: sinon.stub().resolves(mockTransactions),
}

const { nextRequest, call } = new ControllerTestBuilder(
  '@controllers/simplified-account/services/agreements/detail/agreement-detail.controller'
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
    hasPermission: sinon.stub().returns(true),
  })
  .build()

describe('controller: services/agreements/detail', () => {
  describe('get', () => {
    describe('successful agreement detail request', () => {
      beforeEach(async () => {
        nextRequest({
          params: { agreementExternalId: AGREEMENT_EXTERNAL_ID },
          session: {},
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
          'simplified-account/services/agreements/detail'
        )
      })

      it('should call getAgreement with correct parameters', () => {
        sinon.assert.calledWith(mockAgreementsService.getAgreement, AGREEMENT_EXTERNAL_ID, SERVICE_EXTERNAL_ID)
      })

      it('should call getTransactionsForAgreement with correct parameters', () => {
        sinon.assert.calledWith(
          mockAgreementsService.getLatestTransactionsForAgreement,
          GATEWAY_ACCOUNT_ID,
          AGREEMENT_EXTERNAL_ID
        )
      })

      it('should set agreement data on the context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.agreement, mockAgreement)
      })

      it('should set transactions on the context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.transactions, mockTransactions.transactions)
      })

      it('should set showCancelAgreementFunctionality to true when user has permission and agreement is active', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.showCancelAgreementFunctionality, true)
      })

      it('should set backLink in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.backLink, sinon.match.string)
        sinon.assert.match(context.backLink, sinon.match(/agreements/))
      })

      it('should set cancelAgreementLink in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.cancelAgreementLink, sinon.match.string)
        sinon.assert.match(context.cancelAgreementLink, sinon.match(/cancel/))
        sinon.assert.match(context.cancelAgreementLink, sinon.match(new RegExp(AGREEMENT_EXTERNAL_ID)))
      })

      it('should set allAgreementTransactionsLink in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.allAgreementTransactionsLink, sinon.match.string)
        sinon.assert.match(context.allAgreementTransactionsLink, sinon.match(/transactions/))
        sinon.assert.match(
          context.allAgreementTransactionsLink,
          sinon.match(new RegExp(`agreementId=${AGREEMENT_EXTERNAL_ID}`))
        )
      })
    })

    describe('with agreements filter in session', () => {
      beforeEach(async () => {
        nextRequest({
          params: { agreementExternalId: AGREEMENT_EXTERNAL_ID },
          session: { agreementsFilter: 'status=ACTIVE&reference=test' },
        })
        await call('get')
      })

      it('should include filter query parameters in backLink', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.backLink, sinon.match(/\?status=ACTIVE&reference=test/))
      })
    })

    describe('without agreements filter in session', () => {
      beforeEach(async () => {
        nextRequest({
          params: { agreementExternalId: AGREEMENT_EXTERNAL_ID },
          session: {},
        })
        await call('get')
      })

      it('should not include query parameters in backLink', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const backLink = context.backLink as string
        sinon.assert.match(backLink, sinon.match.string)
        sinon.assert.match(backLink.includes('?'), false)
      })
    })

    describe('showCancelAgreementFunctionality conditions', () => {
      describe('when user lacks permission', () => {
        beforeEach(async () => {
          mockResponse.resetHistory()
          nextRequest({
            params: { agreementExternalId: AGREEMENT_EXTERNAL_ID },
            session: {},
            user: {
              hasPermission: sinon.stub().returns(false),
            },
          })
          await call('get')
        })

        it('should set showCancelAgreementFunctionality to false', () => {
          const context = mockResponse.args[0][3] as Record<string, unknown>
          sinon.assert.match(context.showCancelAgreementFunctionality, false)
        })
      })

      describe('when agreement is not active', () => {
        beforeEach(async () => {
          mockResponse.resetHistory()
          const inactiveAgreement = {
            ...mockAgreement,
            status: AgreementStatus.CANCELLED,
          }
          mockAgreementsService.getAgreement.resolves(inactiveAgreement)
          nextRequest({
            params: { agreementExternalId: AGREEMENT_EXTERNAL_ID },
            session: {},
            user: {
              hasPermission: sinon.stub().returns(true),
            },
          })
          await call('get')
        })

        after(() => {
          mockAgreementsService.getAgreement.resolves(mockAgreement)
        })

        it('should set showCancelAgreementFunctionality to false', () => {
          const context = mockResponse.args[0][3] as Record<string, unknown>
          sinon.assert.match(context.showCancelAgreementFunctionality, false)
        })
      })

      describe('when user lacks permission and agreement is not active', () => {
        beforeEach(async () => {
          mockResponse.resetHistory()
          const inactiveAgreement = {
            ...mockAgreement,
            status: AgreementStatus.CANCELLED,
          }
          mockAgreementsService.getAgreement.resolves(inactiveAgreement)
          nextRequest({
            params: { agreementExternalId: AGREEMENT_EXTERNAL_ID },
            session: {},
            user: {
              hasPermission: sinon.stub().returns(false),
            },
          })
          await call('get')
        })

        after(() => {
          mockAgreementsService.getAgreement.resolves(mockAgreement)
        })

        it('should set showCancelAgreementFunctionality to false', () => {
          const context = mockResponse.args[0][3] as Record<string, unknown>
          sinon.assert.match(context.showCancelAgreementFunctionality, false)
        })
      })
    })
  })
})
