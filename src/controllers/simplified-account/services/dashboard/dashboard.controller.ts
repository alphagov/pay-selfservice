import { response } from '@utils/response'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { dashboardTransactionSummary } from '@services/transactions.service'
import { DT_FULL, getPeriodUKDateTimeRange, Period } from '@utils/simplified-account/services/dashboard/datetime-utils'
import formatAccountPathsFor from '@utils/format-account-paths-for'
import paths from '@root/paths'
import formatServicePathsFor from '@utils/format-service-paths-for'
import {
  possibleActions,
  getActionsToDisplay,
  getGoLiveStatus,
  getTelephonePaymentLink,
  isWorldpayTestService,
  getConfigurePSPAccountLink,
  getAccountStatus,
} from '@utils/simplified-account/services/dashboard/actions-utils'
import createLogger from '@utils/logger'
import type { DateTime } from 'luxon'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'

const logger = createLogger(__filename)

async function get(req: ServiceRequest, res: ServiceResponse) {
  const currentPeriod = req.query.period as Period
  const { start, end } = getPeriodUKDateTimeRange(currentPeriod)
  const transactionsPeriodQueryParams = `fromDate={fromDate}&fromTime={fromTime}&toDate={toDate}&toTime={toTime}`
    .replace('{fromDate}', encodeURIComponent(start.toFormat('dd/MM/yyyy')))
    .replace('{fromTime}', encodeURIComponent(start.toFormat('HH:mm:ss')))
    .replace('{toDate}', encodeURIComponent(end.toFormat('dd/MM/yyyy')))
    .replace('{toTime}', encodeURIComponent(end.toFormat('HH:mm:ss')))

  const humanDates = {
    start: start.toLocaleString(DT_FULL),
    end: end.toLocaleString(DT_FULL),
  }

  const agentInitiatedMotoPaymentLink = await getTelephonePaymentLink(req.user, req.service, req.account.id)

  return response(req, res, 'simplified-account/services/dashboard/index', {
    messages: res.locals.flash?.messages ?? [],
    currentPeriod,
    activity: await getActivity(req.account.id, start, end),
    humanDates,
    possibleActions,
    dashboardActions: getActionsToDisplay(
      req.service,
      req.account,
      req.user,
      agentInitiatedMotoPaymentLink !== undefined
    ),
    goLiveStatus: getGoLiveStatus(req.service),
    accountStatus: await getAccountStatus(req.account, req.service),
    isWorldpayTestService: isWorldpayTestService(req.service, req.account),
    links: {
      activity: {
        payments: `${formatAccountPathsFor(paths.account.transactions.index, req.account.externalId)}?state=Success&${transactionsPeriodQueryParams}`,
        refunds: `${formatAccountPathsFor(paths.account.transactions.index, req.account.externalId)}?state=Refund+success&${transactionsPeriodQueryParams}`,
        net: `${formatAccountPathsFor(paths.account.transactions.index, req.account.externalId)}?state=Success&state=Refund+success&${transactionsPeriodQueryParams}`,
      },
      dashboardActions: {
        switchMode:
          req.account.type === GatewayAccountType.LIVE
            ? formatServiceAndAccountPathsFor(
                paths.simplifiedAccount.enterSandboxMode.index,
                req.service.externalId,
                GatewayAccountType.LIVE
              )
            : formatServiceAndAccountPathsFor(
                paths.simplifiedAccount.exitSandboxMode.index,
                req.service.externalId,
                GatewayAccountType.TEST
              ),
        demoPayment: formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.demoPayment.index,
          req.service.externalId,
          req.account.type
        ),
        demoPaymentLink: formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.testWithYourUsers.index,
          req.service.externalId,
          req.account.type
        ),
        createPaymentLink: formatAccountPathsFor(paths.account.paymentLinks.start, req.account.externalId) as string,
        managePaymentLinks: formatAccountPathsFor(
          paths.account.paymentLinks.manage.index,
          req.account.externalId
        ) as string,
        telephonePaymentLink: agentInitiatedMotoPaymentLink,
        requestPspTestAccount: formatServicePathsFor(
          paths.service.requestPspTestAccount,
          req.service.externalId
        ) as string,
        requestLiveAccount: formatServicePathsFor(
          paths.service.requestToGoLive.index,
          req.service.externalId
        ) as string,
        configurePSPAccount: getConfigurePSPAccountLink(req.service, req.account),
      },
    },
  })
}

const getActivity = async (gatewayAccountId: number, start: DateTime, end: DateTime) => {
  let activity = {
    error: false,
  }

  try {
    activity = {
      ...activity,
      ...(await dashboardTransactionSummary(gatewayAccountId, start.toISO()!, end.toISO()!)),
    }
  } catch (err) {
    activity.error = true
    logger.error('Calling ledger to get transactions summary failed', err)
  }

  return activity
}

export { get }
