import express from 'express'
import { AuthenticatedRequest } from '@utils/types/express'
import { TransactionSearchParams } from '@models/transaction/TransactionSearchParams.class'
import { downloadCsv } from '@services/transactions.service'
import logger from '@utils/logger'
import PaymentProviders from '@models/constants/payment-providers'
import date from '@utils/dates'
import { ViewMode } from '@models/view-mode/ViewMode.class'
const LOGGER = logger(__filename)

async function get(req: AuthenticatedRequest & { viewMode: ViewMode }, res: express.Response) {
  const isMoto = Array.from(req.viewMode.gatewayAccounts.values()).some((gatewayAccount) => gatewayAccount.allowMoto)
  const transactionSearchParams = TransactionSearchParams.Builder(req.viewMode.gatewayAccountIds)
    .withSearchQuery(req.query)
    .withMotoHeader(isMoto)
    .withFeeHeaders(req.viewMode.paymentProviders.includes(PaymentProviders.STRIPE))

  const filename = `GOVUK_Pay_${date.dateToDefaultFormat(new Date()).replace(' ', '_')}.csv`
  const [downloadStartTime, downloadEndTime] = await downloadCsv(transactionSearchParams, filename, res)

  LOGGER.info('Completed file stream', {
    time_taken: downloadEndTime - downloadStartTime,
    from_date: transactionSearchParams.fromDate,
    to_date: transactionSearchParams.toDate,
    gateway_payout_id: transactionSearchParams.gatewayPayoutId,
    payment_states: transactionSearchParams.paymentStates,
    refund_states: transactionSearchParams.refundStates,
    dispute_states: transactionSearchParams.disputeStates,
    method: 'future',
    gateway_account_ids: transactionSearchParams.accountIds,
    multiple_accounts: false,
    all_service_transactions: false,
    user_number_of_live_services: req.user.numberOfLiveServices,
    is_live: req.viewMode.modeName === 'live',
    filters: transactionSearchParams.getFilterKeys().join(', '),
  })

  return res.end()
}

export { get }
