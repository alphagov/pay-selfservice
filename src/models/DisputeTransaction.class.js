'use strict'
const lodash = require('lodash')
const { penceToPoundsWithCurrency } = require('../utils/currency-formatter')

const states = require('../utils/states')
const dates = require('../utils/dates')

const reasonToFriendlyString = new Map()

reasonToFriendlyString.set('credit_not_processed', 'Credit not processed')
reasonToFriendlyString.set('duplicate', 'Duplicate')
reasonToFriendlyString.set('fraudulent', 'Fraudulent')
reasonToFriendlyString.set('general', 'General')
reasonToFriendlyString.set('product_not_received', 'Product not received')
reasonToFriendlyString.set('product_unacceptable', 'Product unacceptable')
reasonToFriendlyString.set('unrecognised', 'Unrecognised')
reasonToFriendlyString.set('subscription_canceled', 'Subscription cancelled')
reasonToFriendlyString.set('other', 'Other')

class DisputeTransaction {
  constructor (transactionData) {
    this.created_date = dates.utcToDisplay(transactionData.created_date)
    this.state = {
      status: lodash.get(transactionData, 'state.status'),
      finished: lodash.get(transactionData, 'state.finished')
    }

    if (this.state.status) {
      this.state_friendly = states.getEventDisplayNameForConnectorState(this.state, 'dispute')
    }
    if (transactionData.reason) {
      this.reason_friendly = reasonToFriendlyString.get(transactionData.reason)
    }
    if (transactionData.amount) {
      this.amount_friendly = penceToPoundsWithCurrency(transactionData.amount)
    }
    if (transactionData.net_amount) {
      this.net_amount_friendly = penceToPoundsWithCurrency(transactionData.net_amount)
    }
    if (transactionData.fee) {
      this.fee_friendly = penceToPoundsWithCurrency(transactionData.fee)
    }
    if (transactionData.evidence_due_date) {
      this.evidence_due_date_friendly = dates.utcToDisplay(transactionData.evidence_due_date)
    }
  }
}

module.exports = DisputeTransaction
