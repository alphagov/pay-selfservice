'use strict'

const Ledger = require('../services/clients/ledger_client')

const searchLedger = async function searchLedger (accountId, filters) {
  try {
    const transactions = await Ledger.transactions(accountId, filters)
    return transactions
  } catch (error) {
    throw new Error('GET_FAILED')
  }
}

const searchAllLedger = async function searchAllLedger (accountId, filters) {
  try {
    const transactions = await Ledger.allTransactionPages(accountId, filters)
    return transactions
  } catch (error) {
    throw new Error('GET_FAILED')
  }
}

const searchAllLedgerWithCsv = async function searchAllLedgerWithCsv (accountId, filters) {
  try {
    const transactions = await Ledger.allTransactionsAsCsv(accountId, filters)
    return transactions
  } catch (error) {
    throw new Error('GET_FAILED')
  }
}

exports.search = searchLedger
exports.searchAll = searchAllLedger
exports.searchAllWithCsv = searchAllLedgerWithCsv
