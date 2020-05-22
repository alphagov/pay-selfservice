const chai = require('chai')
const { expect } = chai
const { groupPayoutsByDate } = require('./../../../../app/controllers/payouts/payouts_service')
const fixtures = require('./../../../fixtures/payout_fixtures')

describe('payout service data transforms', () => {
  describe('grouping payouts by date', () => {
    it('groups payouts by date given valid payout response', () => {
      const opts = [
        { paidOutDate: '2019-01-29T08:00:00.000000Z' },
        { paidOutDate: '2019-01-26T08:00:00.000000Z' },
        { paidOutDate: '2019-01-28T08:00:00.000000Z' },
        { paidOutDate: '2019-01-28T08:00:00.000000Z' },
        { paidOutDate: '2019-01-21T08:00:00.000000Z' }
      ]
      const payouts = fixtures.validPayoutSearchResponse(opts).getPlain()

      const grouped = groupPayoutsByDate(payouts.results)

      console.log(grouped)
      // 4 unique days
      expect(Object.keys(grouped).length).to.equal(4)
    })
  })
})
