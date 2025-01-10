'use strict'

const { expect } = require('chai')
const DisputeTransaction = require('./DisputeTransaction.class')
const dates = require('../utils/dates')

describe('Dispute transaction model', () => {
  it('should build dispute transaction correctly for full dispute data', () => {
    const dispute = new DisputeTransaction({
      created_date: '2022-07-26T19:57:26.000Z',
      reason: 'fraudulent',
      state: {
        finished: true,
        status: 'won'
      },
      amount: 20000,
      net_amount: -35000,
      fee: 1500,
      evidence_due_date: '2022-08-04T23:59:59.000Z'
    })

    expect(dispute.created_date).to.equal(dates.utcToDisplay('2022-07-26T19:57:26.000Z'))
    expect(dispute.reason_friendly).to.equal('Fraudulent')
    expect(dispute.amount_friendly).to.equal('£200.00')
    expect(dispute.net_amount_friendly).to.equal('-£350.00')
    expect(dispute.fee_friendly).to.equal('£15.00')
    expect(dispute.state_friendly).to.equal('Dispute won in your favour')
    expect(dispute.evidence_due_date_friendly).to.equal(dates.utcToDisplay('2022-08-04T23:59:59.000Z'))
  })

  it('should build dispute transaction correctly for minimum dispute data', () => {
    const dispute = new DisputeTransaction({
      created_date: '2022-07-26T19:57:26.000Z',
      state: {
        finished: true,
        status: 'under_review'
      }
    })

    expect(dispute.created_date).to.equal(dates.utcToDisplay('2022-07-26T19:57:26.000Z'))
    expect(dispute.state_friendly).to.equal('Dispute under review')

    expect(dispute.reason_friendly).to.be.undefined // eslint-disable-line
    expect(dispute.amount_friendly).to.be.undefined // eslint-disable-line
    expect(dispute.net_amount_friendly).to.be.undefined // eslint-disable-line
    expect(dispute.fee_friendly).to.be.undefined // eslint-disable-line
    expect(dispute.evidence_due_date_friendly).to.be.undefined // eslint-disable-line
  })
})
