const { expect } = require('chai')
const { groupPayoutsByDate } = require('../../../../app/controllers/payouts/payouts.service')
const payoutFixtures = require('../../../fixtures/payout.fixtures')
const userFixtures = require('../../../fixtures/user.fixtures')

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
      const payouts = payoutFixtures.validPayoutSearchResponse(opts).getPlain()

      const grouped = groupPayoutsByDate(payouts.results)

      expect(Object.keys(grouped).length).to.equal(4)
      expect(grouped).to.have.keys('2019-01-29', '2019-01-28', '2019-01-26', '2019-01-21')
      expect(grouped['2019-01-29'].entries).to.have.length(1)
      expect(grouped['2019-01-29'].date.format('YYYY-MM-DD')).to.equal('2019-01-29')
      expect(grouped['2019-01-28'].entries).to.have.length(2)
      expect(grouped['2019-01-26'].entries).to.have.length(1)
      expect(grouped['2019-01-21'].entries).to.have.length(1)
    })

    it('will correctly assign service names if a user is provided', () => {
      const payouts = payoutFixtures
        .validPayoutSearchResponse([{
          paidOutDate: '2019-01-21T08:00:00.000000Z',
          gatewayAccountId: '300'
        }])
        .getPlain()

      const user = userFixtures
        .validUser({
          gateway_account_ids: [ '300' ]
        })
        .getAsObject()

      const grouped = groupPayoutsByDate(payouts.results, user)

      expect(grouped['2019-01-21'].entries).to.have.length(1)
      expect(grouped['2019-01-21'].entries[0].serviceName).to.equal('System Generated')
    })

    it('will return a valid empty set if no payouts or user are provided', () => {
      const grouped = groupPayoutsByDate([], null)
      expect(grouped).to.deep.equal({})
    })

    it('will order formatted payout groups by date descending given entries in any order', () => {
      const opts = [
        { paidOutDate: '2019-01-01T08:00:00.000000Z' },
        { paidOutDate: '2019-01-05T08:00:00.000000Z' },
        { paidOutDate: '2019-04-03T08:00:00.000000Z' },
        { paidOutDate: '2019-01-12T08:00:00.000000Z' },
        { paidOutDate: '2019-01-02T08:00:00.000000Z' }
      ]
      const payouts = payoutFixtures.validPayoutSearchResponse(opts).getPlain()

      const grouped = groupPayoutsByDate(payouts.results)
      const keys = Object.keys(grouped)

      expect(keys[0]).to.equal('2019-04-03')
      expect(keys[1]).to.equal('2019-01-12')
      expect(keys[2]).to.equal('2019-01-05')
      expect(keys[3]).to.equal('2019-01-02')
      expect(keys[4]).to.equal('2019-01-01')
    })
  })
})
