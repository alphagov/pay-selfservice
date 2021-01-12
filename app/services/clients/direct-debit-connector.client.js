'use strict'

// Constants
const DIRECT_DEBIT_TOKEN_PREFIX = 'DIRECT_DEBIT:'

// Exports
module.exports = {
  isADirectDebitAccount
}

function isADirectDebitAccount (accountId) {
  return accountId && (typeof accountId === 'string') && accountId.startsWith(DIRECT_DEBIT_TOKEN_PREFIX)
}
