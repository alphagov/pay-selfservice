import express from 'express'
import { AuthenticatedRequest } from '@utils/types/express'
import { TransactionSearchParams } from '@models/transaction/TransactionSearchParams.class'
import { downloadCsv } from '@services/transactions.service'
import logger from '@utils/logger'
import PaymentProviders from '@models/constants/payment-providers'
import date from '@utils/dates'
import { findGatewayAccountsByService } from '@services/gateway-accounts.service'
const LOGGER = logger(__filename)

async function get(req: AuthenticatedRequest, res: express.Response<unknown, { flash?: Record<string, string[]> }>) {
  const modeFilter = req.params.modeFilter === 'test' ? 'test' : 'live'

  const userServiceExternalIds = req.user.serviceRoles
    .filter((serviceRole) => serviceRole.hasPermission('transactions:read'))
    .map((serviceRole) => serviceRole.service)
    .map((service) => service.externalId)

  const gatewayAccounts = await findGatewayAccountsByService(userServiceExternalIds, modeFilter)
  const gatewayAccountIds = gatewayAccounts.map((gatewayAccountData) => gatewayAccountData.id)
  const transactionSearchParams = TransactionSearchParams.fromSearchQuery(gatewayAccountIds, req.query, false)

  if (gatewayAccounts.some((gatewayAccount) => gatewayAccount.paymentProvider === PaymentProviders.STRIPE)) {
    transactionSearchParams.feeHeaders = true
  }
  transactionSearchParams.motoHeader = gatewayAccounts.some((gatewayAccount) => gatewayAccount.allowMoto)

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
    is_live: modeFilter === 'live',
    filters: transactionSearchParams.getFilterKeys().join(', '),
  })

  return res.end()
}

export { get }
