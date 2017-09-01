'use strict'
// NPM Dependencies
const lodash = require('lodash')
const currencyFormatter = require('currency-formatter')

// Local Dependencies
const states = require('../utils/states')
const dates = require('../utils/dates')

class TransactionEvent {
  constructor(eventData) {
    this.type = eventData.type
    this.amount = eventData.amount
    this.updated = eventData.updated
    this.state = {
      status: lodash.get(eventData, 'state.status'),
      code: lodash.get(eventData, 'state.code'),
      finished: lodash.get(eventData, 'state.finished'),
      message: lodash.get(eventData, 'state.message'),
    }

    this.state_friendly = states.getDescription(this.type, this.state.status)
    this.updated_friendly = dates.utcToDisplay(this.updated)
    this.amount_friendly =  currencyFormatter.format((this.amount / 100).toFixed(2), {code: 'GBP'})
    if (this.amount && this.type.toLowerCase() === 'refund') {
      this.amount_friendly = `–${this.amount_friendly}`
    }
  }
}

module.exports = TransactionEvent