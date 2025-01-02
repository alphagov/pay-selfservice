const sinon = require('sinon')
const proxyquire = require('proxyquire')
const ledgerTransactionFixture = require('../../../test/fixtures/ledger-transaction.fixtures')
const { validGatewayAccountResponse } = require('../../../test/fixtures/gateway-account.fixtures')

describe('Transaction details - GET', () => {
  let res, next, transaction, transactionServiceSpy

  const gatewayAccountId = '15486734'

  const EXTERNAL_GATEWAY_ACCOUNT_ID = 'an-external-id'

  const transactionId = 'a-transaction-id'

  const account = validGatewayAccountResponse(
    {
      external_id: EXTERNAL_GATEWAY_ACCOUNT_ID,
      gateway_account_id: gatewayAccountId,
      payment_provider: 'sandbox',
      credentials: { username: 'a-username' }
    }
  )

  const req = {
    account,
    session: {},
    params: { chargeId: transactionId }
  }

  const responseSpy = {
    response: sinon.spy()
  }

  beforeEach(() => {
    res = {
      render: sinon.spy()
    }

    next = sinon.spy()

    transaction = ledgerTransactionFixture.validTransactionDetailsResponse()
    responseSpy.response.resetHistory()
  })

  describe('passing the isCorporateExemptionsEnabled flag correctly when calling ledgerFindWithEvents', () => {
    it('should not set flag when worldpay_3ds_flag is UNDEFINED on the gateway account', async () => {
      req.account.worldpay_3ds_flex = undefined

      const controller = getControllerWithMocks(transaction, responseSpy)

      await controller(req, res, next)

      sinon.assert.called(responseSpy.response)
      sinon.assert.called(transactionServiceSpy.ledgerFindWithEvents)

      sinon.assert.match(transactionServiceSpy.ledgerFindWithEvents.firstCall.args[2], undefined)
    })

    it('should set flag=false when corporate exemptions = false on the gateway account', async () => {
      req.account.worldpay_3ds_flex = {
        corporate_exemptions_enabled: false
      }

      const controller = getControllerWithMocks(transaction, responseSpy)

      await controller(req, res, next)

      sinon.assert.called(responseSpy.response)
      sinon.assert.called(transactionServiceSpy.ledgerFindWithEvents)

      sinon.assert.match(transactionServiceSpy.ledgerFindWithEvents.firstCall.args[2], false)
    })

    it('should set flag=true when corporate exemptions = true on the gateway account', async () => {
      req.account.worldpay_3ds_flex = {
        corporate_exemptions_enabled: true
      }

      const controller = getControllerWithMocks(transaction, responseSpy)

      await controller(req, res, next)

      sinon.assert.called(responseSpy.response)
      sinon.assert.called(transactionServiceSpy.ledgerFindWithEvents)

      sinon.assert.match(transactionServiceSpy.ledgerFindWithEvents.firstCall.args[2], true)
    })
  })

  function getControllerWithMocks (transaction, responseSpy) {
    transactionServiceSpy = {
      ledgerFindWithEvents: sinon.spy(() => {
        return transaction
      })
    }

    return proxyquire('./transaction-detail.controller', {
      '../../services/transaction.service': transactionServiceSpy,
      '../../utils/response.js': responseSpy
    })
  }
})
