const chai = require('chai')
const nock = require('nock')

const { expect } = chai

const payoutService = require('./../../../app/controllers/payouts/payouts_service')
const fixtures = require('./../../fixtures/payout_fixtures')

const gatewayAccountId = '100'
const ledgerMock = nock(process.env.LEDGER_URL)
const LEDGER_PAYOUT_BACKEND_ROUTE = `/v1/payout?gateway_account_id=${gatewayAccountId}&page=1`

describe('payouts service list payouts helper', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('responds with grouped payouts given a well formed request and existing payouts', async () => {
    const payouts = [
      { gatewayAccountId, paidOutDate: '2019-01-29T08:00:00.000000Z' },
      { gatewayAccountId, paidOutDate: '2019-01-29T09:00:00.000000Z' }
    ]
    ledgerMock.get(LEDGER_PAYOUT_BACKEND_ROUTE)
      .reply(200, fixtures.validPayoutSearchResponse(payouts).getPlain())

    const result = await payoutService.payouts(gatewayAccountId)

    expect(Object.keys(result).length).to.equal(1)
    expect(result['2019-01-29'].entries.length).to.equal(2)
  })

  it('responds with an empty well formed object given no payouts', async () => {
    const payouts = []
    ledgerMock.get(LEDGER_PAYOUT_BACKEND_ROUTE)
      .reply(200, fixtures.validPayoutSearchResponse(payouts).getPlain())

    const result = await payoutService.payouts(gatewayAccountId)

    expect(result).to.deep.equal({})
  })
})
