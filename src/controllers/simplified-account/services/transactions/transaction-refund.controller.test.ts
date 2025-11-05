import sinon from 'sinon'
import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import { beforeEach } from 'mocha'
import { TransactionFixture } from '@test/fixtures/transaction/transaction.fixture'
import { LedgerRefundSummaryFixture } from '@test/fixtures/transaction/ledger-refund-summary.fixture'
import { ChargeRefundRequest } from '@models/charge/ChargeRefundRequest.class'
import { Message } from '@utils/types/express/Message'

const GATEWAY_ACCOUNT_ID = 100
const GATEWAY_ACCOUNT_EXTERNAL_ID = 'ga-123-external-id-abc'
const SERVICE_EXTERNAL_ID = 'service-123-external-id-abc'
const TRANSACTION_EXTERNAL_ID = 'transaction-123-external-id-abc'
const USER_EMAIL_ADDRESS = 'homer.simpson@example.com'
const USER_EXTERNAL_ID = 'user-external-id-123-abc'

const transactionFixture = new TransactionFixture()
const refundedTransaction = new TransactionFixture({
  amount: 1000,
  refundSummary: new LedgerRefundSummaryFixture({
    amountSubmitted: 1000,
    amountRefunded: 1000,
    amountAvailable: 0,
    status: 'full',
  }),
})
const partiallyRefundedTransaction = new TransactionFixture({
  amount: 1000,
  refundSummary: new LedgerRefundSummaryFixture({
    amountSubmitted: 700,
    amountRefunded: 700,
    amountAvailable: 300,
    status: 'available',
  }),
})

const mockResponse = sinon.stub()
const getTransactionStub = sinon.stub().resolves(transactionFixture.toTransaction())
const submitRefundStub = sinon.stub()

const { req, res, nextRequest, call } = new ControllerTestBuilder(
  '@controllers/simplified-account/services/transactions/transaction-refund.controller'
)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/ledger.service': { getTransaction: getTransactionStub },
    '@services/charge.service': { submitRefund: submitRefundStub },
  })
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount({
    id: GATEWAY_ACCOUNT_ID,
    externalId: GATEWAY_ACCOUNT_EXTERNAL_ID,
    type: GatewayAccountType.TEST,
  })
  .withUser({
    email: USER_EMAIL_ADDRESS,
    externalId: USER_EXTERNAL_ID,
  })
  .withParams({
    transactionExternalId: TRANSACTION_EXTERNAL_ID,
  })
  .build()

describe('transaction refund controller', () => {
  describe('get', () => {
    describe('when the transaction has already been fully refunded', () => {
      it('should redirect to the transaction detail page', async () => {
        getTransactionStub.resolves(refundedTransaction.toTransaction())
        await call('get')
        res.redirect.should.have.been.calledOnce
        res.redirect.should.have.been.calledWith(
          `/service/${SERVICE_EXTERNAL_ID}/account/${GatewayAccountType.TEST}/transactions/${TRANSACTION_EXTERNAL_ID}`
        )
      })
    })

    describe('when the transaction has not been fully refunded', () => {
      it('should call the response method with req, res and the refund template', async () => {
        getTransactionStub.resolves(transactionFixture.toTransaction())
        await call('get')

        mockResponse.should.have.been.calledOnce
        mockResponse.should.have.been.calledWith(req, res, 'simplified-account/services/transactions/refund')
      })

      it('should call the response method with the context object', async () => {
        getTransactionStub.resolves(transactionFixture.toTransaction())
        await call('get')

        mockResponse.should.have.been.calledOnce
        mockResponse.should.have.been.calledWith(sinon.match.any, sinon.match.any, sinon.match.any, {
          transaction: transactionFixture.toTransaction(),
          backLink: `/service/${SERVICE_EXTERNAL_ID}/account/${GatewayAccountType.TEST}/transactions/${TRANSACTION_EXTERNAL_ID}`,
        })
      })
    })
  })

  describe('post', () => {
    describe('when the transaction has already been fully refunded', () => {
      it('should redirect to the transaction detail page', async () => {
        getTransactionStub.resolves(refundedTransaction.toTransaction())
        await call('post')
        res.redirect.should.have.been.calledOnce
        res.redirect.should.have.been.calledWith(
          `/service/${SERVICE_EXTERNAL_ID}/account/${GatewayAccountType.TEST}/transactions/${TRANSACTION_EXTERNAL_ID}`
        )
      })

      it('should not issue a refund', async () => {
        getTransactionStub.resolves(refundedTransaction.toTransaction())
        await call('post')
        submitRefundStub.should.not.have.been.called
      })
    })

    describe('with invalid inputs', () => {
      describe('partial refund amount is not a number', () => {
        beforeEach(() => {
          getTransactionStub.resolves(transactionFixture.toTransaction())

          nextRequest({
            body: {
              refundPayment: 'partial',
              partialRefundAmount: 'notanumber',
            },
          })
        })

        it('should call the response method', async () => {
          const thisCall = await call('post')

          mockResponse.should.have.been.calledOnce
          mockResponse.should.have.been.calledWith(thisCall.req, res, 'simplified-account/services/transactions/refund')
        })

        it('should pass the context to the response method with the errors', async () => {
          await call('post')

          mockResponse.should.have.been.calledWith(sinon.match.any, sinon.match.any, sinon.match.any, {
            transaction: transactionFixture.toTransaction(),
            errors: {
              summary: [
                {
                  text: 'Enter an amount to refund in pounds and pence using digits and a decimal point. For example “10.50”',
                  href: '#partial-refund-amount',
                },
              ],
              formErrors: {
                partialRefundAmount:
                  'Enter an amount to refund in pounds and pence using digits and a decimal point. For example “10.50”',
              },
            },
            backLink: `/service/${SERVICE_EXTERNAL_ID}/account/${GatewayAccountType.TEST}/transactions/${TRANSACTION_EXTERNAL_ID}`,
            partialSelected: true,
            partialRefundAmount: 'notanumber',
          })
        })

        it('should not issue a refund', async () => {
          await call('post')
          submitRefundStub.should.not.have.been.called
        })
      })

      describe('partial refund amount is greater than amount available', () => {
        beforeEach(() => {
          getTransactionStub.resolves(transactionFixture.toTransaction())

          nextRequest({
            body: {
              refundPayment: 'partial',
              partialRefundAmount: '10.01',
            },
          })
        })

        it('should call the response method', async () => {
          const thisCall = await call('post')

          mockResponse.should.have.been.calledOnce
          mockResponse.should.have.been.calledWith(thisCall.req, res, 'simplified-account/services/transactions/refund')
        })

        it('should pass the context to the response method with the errors', async () => {
          await call('post')

          mockResponse.should.have.been.calledWith(sinon.match.any, sinon.match.any, sinon.match.any, {
            transaction: transactionFixture.toTransaction(),
            errors: {
              summary: [
                {
                  text: 'Enter a refund amount greater than £0.00 and less than £10.00',
                  href: '#partial-refund-amount',
                },
              ],
              formErrors: {
                partialRefundAmount: 'Enter a refund amount greater than £0.00 and less than £10.00',
              },
            },
            backLink: `/service/${SERVICE_EXTERNAL_ID}/account/${GatewayAccountType.TEST}/transactions/${TRANSACTION_EXTERNAL_ID}`,
            partialSelected: true,
            partialRefundAmount: '10.01',
          })
        })

        it('should not issue a refund', async () => {
          await call('post')
          submitRefundStub.should.not.have.been.called
        })
      })

      describe('partial refund amount is zero', () => {
        beforeEach(() => {
          getTransactionStub.resolves(transactionFixture.toTransaction())

          nextRequest({
            body: {
              refundPayment: 'partial',
              partialRefundAmount: '0.00',
            },
          })
        })

        it('should call the response method', async () => {
          const thisCall = await call('post')

          mockResponse.should.have.been.calledOnce
          mockResponse.should.have.been.calledWith(thisCall.req, res, 'simplified-account/services/transactions/refund')
        })

        it('should pass the context to the response method with the errors', async () => {
          await call('post')

          mockResponse.should.have.been.calledWith(sinon.match.any, sinon.match.any, sinon.match.any, {
            transaction: transactionFixture.toTransaction(),
            errors: {
              summary: [
                {
                  text: 'Enter a refund amount greater than £0.00 and less than £10.00',
                  href: '#partial-refund-amount',
                },
              ],
              formErrors: {
                partialRefundAmount: 'Enter a refund amount greater than £0.00 and less than £10.00',
              },
            },
            backLink: `/service/${SERVICE_EXTERNAL_ID}/account/${GatewayAccountType.TEST}/transactions/${TRANSACTION_EXTERNAL_ID}`,
            partialSelected: true,
            partialRefundAmount: '0.00',
          })
        })

        it('should not issue a refund', async () => {
          await call('post')
          submitRefundStub.should.not.have.been.called
        })
      })

      describe('partial refund amount is empty', () => {
        beforeEach(() => {
          getTransactionStub.resolves(transactionFixture.toTransaction())

          nextRequest({
            body: {
              refundPayment: 'partial',
              partialRefundAmount: '',
            },
          })
        })

        it('should call the response method', async () => {
          const thisCall = await call('post')

          mockResponse.should.have.been.calledOnce
          mockResponse.should.have.been.calledWith(thisCall.req, res, 'simplified-account/services/transactions/refund')
        })

        it('should pass the context to the response method with the errors', async () => {
          await call('post')

          mockResponse.should.have.been.calledWith(sinon.match.any, sinon.match.any, sinon.match.any, {
            transaction: transactionFixture.toTransaction(),
            errors: {
              summary: [
                {
                  text: 'Enter a refund amount',
                  href: '#partial-refund-amount',
                },
              ],
              formErrors: {
                partialRefundAmount: 'Enter a refund amount',
              },
            },
            backLink: `/service/${SERVICE_EXTERNAL_ID}/account/${GatewayAccountType.TEST}/transactions/${TRANSACTION_EXTERNAL_ID}`,
            partialSelected: true,
            partialRefundAmount: '',
          })
        })

        it('should not issue a refund', async () => {
          await call('post')
          submitRefundStub.should.not.have.been.called
        })
      })
    })

    describe('with valid input', () => {
      describe('for a full refund when the full refund amount is available', () => {
        beforeEach(() => {
          nextRequest({
            body: {
              refundPayment: 'full',
              partialRefundAmount: '',
            },
          })
          getTransactionStub.resolves(transactionFixture.toTransaction())
        })

        it('should submit a refund for the full amount', async () => {
          await call('post')
          submitRefundStub.should.have.been.calledOnce
          submitRefundStub.should.have.been.calledWith(
            SERVICE_EXTERNAL_ID,
            GatewayAccountType.TEST,
            TRANSACTION_EXTERNAL_ID,
            new ChargeRefundRequest()
              .withAmount(1000)
              .withRefundAmountAvailable(1000)
              .withUserEmail(USER_EMAIL_ADDRESS)
              .withUserExternalId(USER_EXTERNAL_ID)
          )
        })

        it('should show a success banner', async () => {
          await call('post')
          req.flash.should.have.been.calledOnce
          req.flash.should.have.been.calledWith(
            'messages',
            Message.Success('Refund successful', 'It may take up to six days to process.')
          )
        })

        it('should redirect to the transaction detail page', async () => {
          await call('post')
          res.redirect.should.have.been.calledWith(
            `/service/${SERVICE_EXTERNAL_ID}/account/${GatewayAccountType.TEST}/transactions/${TRANSACTION_EXTERNAL_ID}`
          )
        })
      })

      describe('for a full refund when a partial refund has already been issued', () => {
        beforeEach(() => {
          nextRequest({
            body: {
              refundPayment: 'full',
              partialRefundAmount: '',
            },
          })
          getTransactionStub.resolves(partiallyRefundedTransaction.toTransaction())
        })

        it('should submit a refund for the remaining amount available', async () => {
          await call('post')
          submitRefundStub.should.have.been.calledOnce
          submitRefundStub.should.have.been.calledWith(
            SERVICE_EXTERNAL_ID,
            GatewayAccountType.TEST,
            TRANSACTION_EXTERNAL_ID,
            new ChargeRefundRequest()
              .withAmount(300)
              .withRefundAmountAvailable(300)
              .withUserEmail(USER_EMAIL_ADDRESS)
              .withUserExternalId(USER_EXTERNAL_ID)
          )
        })
      })

      describe('for a partial refund', () => {
        beforeEach(() => {
          nextRequest({
            body: {
              refundPayment: 'partial',
              partialRefundAmount: '2.50',
            },
          })
          getTransactionStub.resolves(partiallyRefundedTransaction.toTransaction())
        })

        it('should submit a refund for the chosen amount', async () => {
          await call('post')
          submitRefundStub.should.have.been.calledOnce
          submitRefundStub.should.have.been.calledWith(
            SERVICE_EXTERNAL_ID,
            GatewayAccountType.TEST,
            TRANSACTION_EXTERNAL_ID,
            new ChargeRefundRequest()
              .withAmount(250)
              .withRefundAmountAvailable(300)
              .withUserEmail(USER_EMAIL_ADDRESS)
              .withUserExternalId(USER_EXTERNAL_ID)
          )
        })
      })
    })
  })
})
