'use strict'
const lodash = require('lodash')
const { penceToPoundsWithCurrency } = require('../utils/currency-formatter')

const states = require('../utils/states')
const dates = require('../utils/dates')

class TransactionEvent {
  constructor (eventData, timeZoneToReturnDatesIn) {
    this.type = eventData.type
    this.amount = eventData.amount
    this.updated = eventData.updated
    this.refund_reference = eventData.refund_reference
    this.submitted_by = eventData.submitted_by
    this.state = {
      status: lodash.get(eventData, 'state.status'),
      code: lodash.get(eventData, 'state.code'),
      finished: lodash.get(eventData, 'state.finished'),
      message: lodash.get(eventData, 'state.message')
    }

    this.state_friendly = states.getEventDisplayNameForConnectorState(this.state, this.type)
    this.updated_friendly = dates.utcToTimeZoneDisplay(this.updated, timeZoneToReturnDatesIn)
    this.amount_friendly = penceToPoundsWithCurrency(this.amount)
    const transactionType = this.type.toLowerCase()
    if (this.amount && (transactionType === 'refund' || transactionType === 'dispute')) {
      this.amount_friendly = `–${this.amount_friendly}`
    }
  }
}

module.exports = TransactionEvent
