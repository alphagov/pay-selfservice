import { TransactionSearchParams } from '@models/transaction/TransactionSearchParams.class'

describe('Transaction search params tests', () => {
  it('should produce correct query params when only a gatewayPayoutId is provided', () => {
    const testGatewayAccountIds = ['1', '2', '3']

    const searchParams = TransactionSearchParams.fromSearchQuery(
      testGatewayAccountIds,
      {
        gatewayPayoutId: 'gateway-payout-id-abc-123',
      },
      false
    )

    const queryString = searchParams.toJson().asQueryString()
    queryString.should.eq('account_id=1%2C2%2C3&gateway_payout_id=gateway-payout-id-abc-123')
  })
})
