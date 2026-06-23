import LedgerClient from '@services/clients/pay/LedgerClient.class'
import { TransactionSearchParams } from '@models/transaction/TransactionSearchParams.class'
import express from 'express'
import Stream from '@services/clients/stream.client'
import { RESTClientError } from '@govuk-pay/pay-js-commons/lib/utils/axios-base-client/errors'
import { GatewayTimeoutError } from '@root/errors'
import { Transaction } from '@models/transaction/Transaction'

const ledgerClient = new LedgerClient()

const dashboardTransactionSummary = async (gatewayAccountId: number, fromDateTime: string, toDateTime: string) => {
  const transactionSummary = await ledgerClient.reports.transactionsSummary(gatewayAccountId, fromDateTime, toDateTime)
  return {
    successfulPayments: {
      count: transactionSummary.payments.count,
      totalInPence: transactionSummary.payments.grossAmount,
    },
    refundedPayments: {
      count: transactionSummary.refunds.count,
      totalInPence: transactionSummary.refunds.grossAmount,
    },
    netIncome: {
      totalInPence: transactionSummary.netIncome,
    },
  }
}

const getTransaction = async (transactionExternalId: string, gatewayAccountId: number) =>
  await ledgerClient.transactions.get(transactionExternalId, gatewayAccountId)

interface TransactionSearchResults {
  total: number
  count: number
  page: number
  transactions: Transaction[]
}

const searchTransactions = async (
  transactionSearchParams: TransactionSearchParams
): Promise<TransactionSearchResults> => {
  return ledgerClient.transactions.search(transactionSearchParams).catch((e) => {
    if (e instanceof RESTClientError && e.errorCode === 504) {
      throw GatewayTimeoutError.Ledger('Transactions search timed out')
    } else {
      throw e
    }
  })
}

const downloadCsv = async (
  transactionSearchParams: TransactionSearchParams,
  filename: string,
  res: express.Response
) => {
  const ledgerUrl = process.env.LEDGER_URL!
  const downloadUrl = `${ledgerUrl}/v1/transaction?${transactionSearchParams.toJson().asQueryString()}`

  const onData = (chunk: unknown) => {
    res.write(chunk)
  }

  const downloadStartTime = Date.now()

  return new Promise<[number, number]>((resolve, reject) => {
    const onComplete = () => {
      const downloadEndTime = Date.now()
      resolve([downloadStartTime, downloadEndTime])
    }
    const onError = () => reject(new Error('Unable to download transactions'))

    const downloadStream = new Stream(onData, onComplete, onError)

    res.setHeader('Content-disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Type', 'text/csv')

    downloadStream.request(downloadUrl)
  })
}

const getEvents = async (transactionExternalId: string, gatewayAccountId: number) =>
  await ledgerClient.transactions.events(transactionExternalId, gatewayAccountId)

const getDisputes = async (transactionExternalId: string, gatewayAccountId: number) =>
  await ledgerClient.transactions.disputes(transactionExternalId, gatewayAccountId)

export {
  dashboardTransactionSummary,
  getTransaction,
  searchTransactions,
  getEvents,
  getDisputes,
  downloadCsv,
  TransactionSearchResults,
}
