import LedgerClient from '@services/clients/pay/LedgerClient.class'
import { TransactionSearchParams } from '@models/transaction/TransactionSearchParams.class'
import express from 'express'
import Stream from '@services/clients/stream.client'

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

const searchTransactions = async (transactionSearchParams: TransactionSearchParams) => {
  return ledgerClient.transactions.search(transactionSearchParams)
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

export { dashboardTransactionSummary, getTransaction, searchTransactions, getEvents, getDisputes, downloadCsv }
