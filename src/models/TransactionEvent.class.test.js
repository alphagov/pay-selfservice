'use strict'

const { expect } = require('chai')
const TransactionEvent = require('./TransactionEvent.class')
const states = require('../utils/states')
const dates = require('../utils/dates')

describe.only('Transaction event model', () => {
  it('should build transaction event correctly for payment transaction data', () => {
    const eventData = {
      type: 'PAYMENT',
      amount: 5000,
      updated: '2022-07-27T14:45:22.000Z',
      refund_reference: null,
      submitted_by: 'user@example.com',
      state: {
        status: 'success',
        code: 'P0010',
        finished: true,
        message: 'Payment successful'
      }
    }

    const transactionEvent = new TransactionEvent(eventData)

    console.log('Type:', eventData.type)
    console.log('State:', eventData.state)
    console.log('Generated friendly name:', transactionEvent.state_friendly)

    expect(transactionEvent.type).to.equal('PAYMENT')
    expect(transactionEvent.amount).to.equal(5000)
    expect(transactionEvent.updated).to.equal('2022-07-27T14:45:22.000Z')
    expect(transactionEvent.refund_reference).to.equal(null)
    expect(transactionEvent.submitted_by).to.equal('user@example.com')
    expect(transactionEvent.state.status).to.equal('success')
    expect(transactionEvent.state.code).to.equal('P0010')
    expect(transactionEvent.state.finished).to.equal(true)
    expect(transactionEvent.state.message).to.equal('Payment successful')

    expect(transactionEvent.updated_friendly).to.equal(
      dates.utcToDisplay('2022-07-27T14:45:22.000Z')
    )
    expect(transactionEvent.amount_friendly).to.equal('£50.00')
    expect(transactionEvent.state_friendly).to.equal(
      states.getEventDisplayNameForConnectorState(
        transactionEvent.state,
        transactionEvent.type
      )
    )
  })

  it('should build transaction event correctly for refund transaction data', () => {
    const eventData = {
      type: 'REFUND',
      amount: 2500,
      updated: '2022-07-28T10:15:33.000Z',
      refund_reference: 'refund_123abc',
      submitted_by: 'admin@example.com',
      state: {
        status: 'success',
        code: 'R0020',
        finished: true,
        message: 'Refund processed'
      }
    }

    const transactionEvent = new TransactionEvent(eventData)

    console.log('Type:', eventData.type)
    console.log('State:', eventData.state)
    console.log('Generated friendly name:', transactionEvent.state_friendly)

    expect(transactionEvent.type).to.equal('REFUND')
    expect(transactionEvent.amount).to.equal(2500)
    expect(transactionEvent.refund_reference).to.equal('refund_123abc')

    expect(transactionEvent.amount_friendly).to.equal('–£25.00')
  })

  it('should build transaction event correctly for dispute transaction data', () => {
    const eventData = {
      type: 'DISPUTE',
      amount: 7500,
      updated: '2022-07-29T09:30:45.000Z',
      refund_reference: null,
      submitted_by: null,
      state: {
        status: 'needs_response',
        code: 'D0030',
        finished: false,
        message: 'Dispute needs response'
      }
    }

    const transactionEvent = new TransactionEvent(eventData)

    console.log('Type:', eventData.type)
    console.log('State:', eventData.state)
    console.log('Generated friendly name:', transactionEvent.state_friendly)

    expect(transactionEvent.type).to.equal('DISPUTE')
    expect(transactionEvent.amount).to.equal(7500)

    expect(transactionEvent.amount_friendly).to.equal('–£75.00')
  })

  it('should negate amount for dispute transactions that are not won', () => {
    const eventData = {
      type: 'DISPUTE',
      amount: 7500,
      updated: '2022-07-29T09:30:45.000Z',
      refund_reference: null,
      submitted_by: null,
      state: {
        status: 'needs_response',
        code: 'D0030',
        finished: false,
        message: 'Dispute needs response'
      }
    }

    const transactionEvent = new TransactionEvent(eventData)

    expect(transactionEvent.type).to.equal('DISPUTE')
    expect(transactionEvent.amount).to.equal(7500)

    expect(transactionEvent.amount_friendly).to.equal('–£75.00')
  })

  it('should not negate amount for dispute transactions that are won', () => {
    const eventData = {
      type: 'DISPUTE',
      amount: 7500,
      updated: '2022-07-29T09:30:45.000Z',
      refund_reference: null,
      submitted_by: null,
      state: {
        status: 'won',
        code: 'D0050',
        finished: true,
        message: 'Dispute won in your favor'
      }
    }

    const transactionEvent = new TransactionEvent(eventData)

    console.log('Type:', eventData.type)
    console.log('State:', eventData.state)
    console.log('Generated friendly name:', transactionEvent.state_friendly)

    expect(transactionEvent.type).to.equal('DISPUTE')
    expect(transactionEvent.amount).to.equal(7500)

    expect(transactionEvent.amount_friendly).to.equal('£75.00')
  })

  it('should build transaction event correctly with minimal data', () => {
    const eventData = {
      type: 'PAYMENT',
      amount: 1000,
      updated: '2022-07-30T16:22:10.000Z',
      state: {
        status: 'created'
      }
    }

    const transactionEvent = new TransactionEvent(eventData)

    console.log('Type:', eventData.type)
    console.log('State:', eventData.state)
    console.log('Generated friendly name:', transactionEvent.state_friendly)

    expect(transactionEvent.type).to.equal('PAYMENT')
    expect(transactionEvent.amount).to.equal(1000)
    expect(transactionEvent.updated).to.equal('2022-07-30T16:22:10.000Z')
    expect(transactionEvent.refund_reference).to.equal(undefined)
    expect(transactionEvent.submitted_by).to.equal(undefined)

    expect(transactionEvent.state.status).to.equal('created')
    expect(transactionEvent.state.code).to.equal(undefined)
    expect(transactionEvent.state.finished).to.equal(undefined)
    expect(transactionEvent.state.message).to.equal(undefined)

    expect(transactionEvent.updated_friendly).to.equal(
      dates.utcToDisplay('2022-07-30T16:22:10.000Z')
    )
    expect(transactionEvent.amount_friendly).to.equal('£10.00')
    expect(transactionEvent.state_friendly).to.equal(
      states.getEventDisplayNameForConnectorState(
        { status: 'created' },
        'PAYMENT'
      )
    )
  })

  it('should handle transaction events with no amount', () => {
    const eventData = {
      type: 'REFUND',
      updated: '2022-07-31T08:45:12.000Z',
      state: {
        status: 'submitted',
        finished: false
      }
    }

    const transactionEvent = new TransactionEvent(eventData)

    console.log('Type:', eventData.type)
    console.log('State:', eventData.state)
    console.log('Generated friendly name:', transactionEvent.state_friendly)

    expect(transactionEvent.amount).to.equal(undefined)
    expect(transactionEvent.amount_friendly).to.equal('£NaN')
    expect(transactionEvent.state_friendly).to.equal(
      states.getEventDisplayNameForConnectorState(
        { status: 'submitted', finished: false },
        'REFUND'
      )
    )
  })

  // TODO: Remove. I am just investigating.
  it('TEMPORARY!  log friendly names for payment events / states', () => {
    console.log('\nINVESTIGATING PAYMENT EVENTS FRIENDLY NAMES')
    const paymentStates = ['created', 'started', 'submitted', 'capturable', 'success', 'declined', 'timedout', 'cancelled', 'error']

    paymentStates.forEach(status => {
      const eventData = {
        type: 'PAYMENT',
        amount: 1000,
        updated: '2022-07-30T16:22:10.000Z',
        state: { status }
      }
      const transactionEvent = new TransactionEvent(eventData)
      console.log(`PAYMENT with status '${status}' is displayed with friendly name '${transactionEvent.state_friendly}'`)
    })
  })

  it('TEMPORARY! log friendly names for refund events / states', () => {
    console.log('\nINVESTIGATING REFUND EVENTS FRIENDLY NAMES')
    const refundStates = ['submitted', 'error', 'success']

    refundStates.forEach(status => {
      const eventData = {
        type: 'REFUND',
        amount: 1000,
        updated: '2022-07-30T16:22:10.000Z',
        state: { status }
      }
      const transactionEvent = new TransactionEvent(eventData)
      console.log(`REFUND with status '${status}' is displayed with friendly name '${transactionEvent.state_friendly}'`)
    })
  })

  it('TEMPORARY! log friendly names for various dispute events / states', () => {
    console.log('\nINVESTIGATING DISPUTE EVENTS FRIENDLY NAMES')
    const disputeStates = ['needs_response', 'under_review', 'won', 'lost']

    disputeStates.forEach(status => {
      const eventData = {
        type: 'DISPUTE',
        amount: 1000,
        updated: '2022-07-30T16:22:10.000Z',
        state: { status }
      }
      const transactionEvent = new TransactionEvent(eventData)
      console.log(`DISPUTE with status '${status}' is displayed with friendly name '${transactionEvent.state_friendly}'`)
    })
  })

  it('TEMPORARY! log friendly names for failed states with error codes', () => {
    console.log('\nINVESTIGATING FAILED STATES WITH ERROR CODES')
    const errorCodes = ['P0010', 'P0020', 'P0030']

    errorCodes.forEach(code => {
      const eventData = {
        type: 'PAYMENT',
        amount: 1000,
        updated: '2022-07-30T16:22:10.000Z',
        state: {
          status: 'failed',
          code: code
        }
      }
      const transactionEvent = new TransactionEvent(eventData)
      console.log(`PAYMENT with status 'failed' and code '${code}' is displayed with friendly name '${transactionEvent.state_friendly}'`)
    })
  })
})
