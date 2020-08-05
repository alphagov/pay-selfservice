'use strict'

const { GO_CARDLESS_ACCOUNT_ALREADY_LINKED_TO_ANOTHER_ACCOUNT } = require('../../app/models/error-identifier')

module.exports = {
  exchangeAccessTokenAccountAlreadyConnectedResponse: (opts = {}) => {
    return {
      message: opts.message || 'This has failed',
      error_identifier: GO_CARDLESS_ACCOUNT_ALREADY_LINKED_TO_ANOTHER_ACCOUNT
    }
  }
}
