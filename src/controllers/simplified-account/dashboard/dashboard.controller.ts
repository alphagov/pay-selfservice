import { response } from '@utils/response'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { dashboardTransactionSummary } from '@services/ledger.service'
import { DT_FULL, getPeriodUKDateTimeRange, Period } from '@utils/simplified-account/services/dashboard/datetime-utils'
import formatAccountPathsFor from '@utils/format-account-paths-for'
import paths from '@root/paths'

const actions = {
  demoPayment: 0,
  testPaymentLink: 1,
  directDebitPaymentFlow: 2,
  paymentLinks: 3,
  requestPspTestAccount: 4,
  goLive: 5,
  telephonePaymentLink: 6,
}

async function get(req: ServiceRequest, res: ServiceResponse) {
  const period = req.query.period as Period
  const { start, end } = getPeriodUKDateTimeRange(period)
  const activity = await dashboardTransactionSummary(req.account.id, start.toISO()!, end.toISO()!)
  const transactionsPeriodQueryString = `fromDate={fromDate}&fromTime={fromTime}&toDate={toDate}&toTime={toTime}`
    .replace('{fromDate}', encodeURIComponent(start.toFormat('dd/MM/yyyy')))
    .replace('{fromTime}', encodeURIComponent(start.toFormat('HH:mm:ss')))
    .replace('{toDate}', encodeURIComponent(end.toFormat('dd/MM/yyyy')))
    .replace('{toTime}', encodeURIComponent(end.toFormat('HH:mm:ss')))

  const humanDates = {
    start: start.toLocaleString(DT_FULL),
    end: end.toLocaleString(DT_FULL),
  }

  return response(req, res, 'simplified-account/services/dashboard/index', {
    period,
    activity,
    humanDates,
    actions,
    dashboardActions: [
      actions.demoPayment,
      actions.testPaymentLink,
      actions.directDebitPaymentFlow,
      actions.paymentLinks,
      actions.requestPspTestAccount,
      actions.goLive,
      // actions.telephonePaymentLink,
    ],
    links: {
      payments: `${formatAccountPathsFor(paths.account.transactions.index, req.account.externalId)}?state=Success&${transactionsPeriodQueryString}`,
      refunds: `${formatAccountPathsFor(paths.account.transactions.index, req.account.externalId)}?state=Refund+success&${transactionsPeriodQueryString}`,
      net: `${formatAccountPathsFor(paths.account.transactions.index, req.account.externalId)}?state=Success&state=Refund+success&${transactionsPeriodQueryString}`,
    },
  })
}

export { get }
